import { Hono } from "hono";
import { githubAuth } from "@hono/oauth-providers/github";
import { createError, createSuccess, ReasonPhrases } from "@/utils/respond";
import {
    loginUserWithUsernameAndPassword,
    setUserPassword,
    upsertUserFromGithub,
} from "@/utils/sql";
import {
    clearUserSession,
    createUserSession,
    getCurrentUser,
    requireAuth,
} from "@/utils/session";

const auth = new Hono<{ Bindings: CloudflareBindings }>();

const GITHUB_EMAILS_URL = "https://api.github.com/user/emails";

auth.use(
    "/github",
    async (c, next) => {
        const clientId = await c.env.KV.get("GITHUB_CLIENT_ID");
        const clientSecret = await c.env.KV.get("GITHUB_CLIENT_SECRET");

        if (!clientId || !clientSecret) {
            return c.json(
                createError(
                    ReasonPhrases.SERVICE_UNAVAILABLE,
                    "GitHub OAuth is not configured",
                ),
                503,
            );
        }

        const oauth = await githubAuth({
            client_id: clientId,
            client_secret: clientSecret,
            scope: ["read:user", "user:email"],
            oauthApp: true,
        });

        return oauth(c, next);
    },
);

// GET /api/v1/auth/github → GitHub OAuth initiate + callback (single route)
auth.get(
    "/github",
    async (c) => {
        const githubUser = c.get("user-github");
        const token = c.get("token");

        if (!githubUser) {
            return c.json(
                createError(
                    ReasonPhrases.BAD_GATEWAY,
                    "Failed to retrieve GitHub user",
                ),
                502,
            );
        }

        let email = githubUser.email;
        if (!email && token?.token) {
            try {
                const emailsResponse = await fetch(GITHUB_EMAILS_URL, {
                    headers: {
                        Authorization: `Bearer ${token.token}`,
                        Accept: "application/vnd.github+json",
                        "User-Agent": "Coffli",
                    },
                });
                if (emailsResponse.ok) {
                    const emails = (await emailsResponse.json()) as Array<{
                        email: string;
                        primary: boolean;
                        verified: boolean;
                    }>;
                    email = emails.find((e) =>
                        e.primary && e.verified
                    )?.email ||
                        emails.find((e) => e.verified)?.email;
                }
            } catch {
                // email is optional, continue without it
            }
        }

        const user = await upsertUserFromGithub(c.env.D1, {
            github_id: String(githubUser.id),
            github_login: githubUser.login || "",
            avatar_url: githubUser.avatar_url || "",
            bio: githubUser.bio || undefined,
            email: email || undefined,
        });

        await createUserSession(c, user.id);
        return c.redirect("/");
    },
);

// POST /api/v1/auth/login → Password login
auth.post("/login", async (c) => {
    let body: { username?: string; password?: string };
    try {
        body = await c.req.json();
    } catch {
        return c.json(
            createError(ReasonPhrases.BAD_REQUEST, "Invalid JSON body"),
            400,
        );
    }

    const { username, password } = body;
    if (!username || !password) {
        return c.json(
            createError(
                ReasonPhrases.BAD_REQUEST,
                "Username and password are required",
            ),
            400,
        );
    }

    const user = await loginUserWithUsernameAndPassword(
        c.env.D1,
        username,
        password,
    );

    if (!user) {
        return c.json(
            createError(
                ReasonPhrases.UNAUTHORIZED,
                "Invalid username or password",
            ),
            401,
        );
    }

    await createUserSession(c, user.id);

    const { password_hash, ...publicUser } = user;
    return c.json(
        createSuccess({
            message: "Logged in successfully",
            user: publicUser,
        }),
    );
});

// POST /api/v1/auth/logout
auth.post("/logout", async (c) => {
    await clearUserSession(c, c.env.D1);
    return c.json(createSuccess({ message: "Logged out successfully" }));
});

// GET /api/v1/auth/me → Current user
auth.get("/me", requireAuth, async (c) => {
    const user = getCurrentUser(c);
    const { password_hash, ...publicUser } = user;
    return c.json(createSuccess({ user: publicUser }));
});

// POST /api/v1/auth/password → Set or update password
auth.post("/password", requireAuth, async (c) => {
    let body: { password?: string };
    try {
        body = await c.req.json();
    } catch {
        return c.json(
            createError(ReasonPhrases.BAD_REQUEST, "Invalid JSON body"),
            400,
        );
    }

    const { password } = body;
    if (!password || password.length < 6) {
        return c.json(
            createError(
                ReasonPhrases.BAD_REQUEST,
                "Password is required and must be at least 6 characters",
            ),
            400,
        );
    }

    const user = getCurrentUser(c);
    await setUserPassword(c.env.D1, user.id, password);

    return c.json(
        createSuccess({ message: "Password updated successfully" }),
    );
});

export default auth;
