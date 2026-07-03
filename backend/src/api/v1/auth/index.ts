import { Hono } from "hono";
import type { Context } from "hono";
import { getCookie, setCookie, deleteCookie } from "hono/cookie";
import { createError, createSuccess, ReasonPhrases } from "@/utils/respond";
import {
    loginUserWithUsernameAndPassword,
    setUserPassword,
    upsertUserFromGithub,
} from "@/utils/sql";
import {
    createUserSession,
    clearUserSession,
    requireAuth,
    getCurrentUser,
} from "@/utils/session";

const auth = new Hono<{ Bindings: CloudflareBindings }>();

const GITHUB_AUTH_URL = "https://github.com/login/oauth/authorize";
const GITHUB_TOKEN_URL = "https://github.com/login/oauth/access_token";
const GITHUB_USER_URL = "https://api.github.com/user";
const GITHUB_EMAILS_URL = "https://api.github.com/user/emails";
const STATE_COOKIE = "oauth_state";

async function getKV(c: Context<{ Bindings: CloudflareBindings }>, key: string): Promise<string | null> {
    return await c.env.KV.get(key);
}

// GET /api/v1/auth/github → Redirect to GitHub OAuth
auth.get("/github", async (c) => {
    const clientId = await getKV(c, "GITHUB_CLIENT_ID");
    if (!clientId) {
        return c.json(
            createError(
                ReasonPhrases.SERVICE_UNAVAILABLE,
                "GitHub OAuth is not configured",
            ),
            503,
        );
    }

    const siteUrl = await getKV(c, "SITE_URL") || "https://coffli.pages.dev";
    const state = crypto.randomUUID();
    const redirectUri = `${siteUrl}/api/v1/auth/github/callback`;

    setCookie(c, STATE_COOKIE, state, {
        httpOnly: true,
        secure: true,
        sameSite: "Lax",
        path: "/",
        maxAge: 600,
    });

    const url = new URL(GITHUB_AUTH_URL);
    url.searchParams.set("client_id", clientId);
    url.searchParams.set("redirect_uri", redirectUri);
    url.searchParams.set("state", state);
    url.searchParams.set("scope", "read:user user:email");

    return c.redirect(url.toString(), 302);
});

// GET /api/v1/auth/github/callback → Handle GitHub OAuth callback
auth.get("/github/callback", async (c) => {
    const code = c.req.query("code");
    const state = c.req.query("state");
    const storedState = getCookie(c, STATE_COOKIE);

    deleteCookie(c, STATE_COOKIE, { path: "/" });

    if (!code || !state || !storedState || state !== storedState) {
        return c.json(
            createError(ReasonPhrases.BAD_REQUEST, "Invalid OAuth state"),
            400,
        );
    }

    const clientId = await getKV(c, "GITHUB_CLIENT_ID");
    const clientSecret = await getKV(c, "GITHUB_CLIENT_SECRET");
    if (!clientId || !clientSecret) {
        return c.json(
            createError(
                ReasonPhrases.SERVICE_UNAVAILABLE,
                "GitHub OAuth is not configured",
            ),
            503,
        );
    }

    const tokenResponse = await fetch(GITHUB_TOKEN_URL, {
        method: "POST",
        headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            client_id: clientId,
            client_secret: clientSecret,
            code,
        }),
    });

    if (!tokenResponse.ok) {
        return c.json(
            createError(
                ReasonPhrases.BAD_GATEWAY,
                "Failed to exchange GitHub code",
            ),
            502,
        );
    }

    const tokenData = await tokenResponse.json() as {
        access_token?: string;
        error?: string;
    };
    if (!tokenData.access_token) {
        return c.json(
            createError(
                ReasonPhrases.BAD_GATEWAY,
                "GitHub did not return access token",
                { error: tokenData.error },
            ),
            502,
        );
    }

    const userResponse = await fetch(GITHUB_USER_URL, {
        headers: {
            Authorization: `Bearer ${tokenData.access_token}`,
            Accept: "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
            "User-Agent": "Coffli",
        },
    });

    if (!userResponse.ok) {
        return c.json(
            createError(
                ReasonPhrases.BAD_GATEWAY,
                "Failed to fetch GitHub user",
            ),
            502,
        );
    }

    const githubUser = await userResponse.json() as {
        id: number;
        login: string;
        avatar_url?: string;
        bio?: string;
        email?: string;
    };

    let email = githubUser.email;
    if (!email) {
        const emailsResponse = await fetch(GITHUB_EMAILS_URL, {
            headers: {
                Authorization: `Bearer ${tokenData.access_token}`,
                Accept: "application/vnd.github+json",
                "X-GitHub-Api-Version": "2022-11-28",
                "User-Agent": "Coffli",
            },
        });

        if (emailsResponse.ok) {
            const emails = await emailsResponse.json() as Array<{
                email: string;
                primary: boolean;
                verified: boolean;
            }>;
            const primary = emails.find((e) => e.primary && e.verified);
            email = primary?.email || emails.find((e) => e.verified)?.email;
        }
    }

    const user = await upsertUserFromGithub(c.env.D1, {
        github_id: String(githubUser.id),
        github_login: githubUser.login,
        avatar_url: githubUser.avatar_url || "",
        bio: githubUser.bio,
        email,
    });

    await createUserSession(c, user.id);

    const siteUrl = await getKV(c, "SITE_URL") || "https://coffli.pages.dev";
    return c.redirect(`${siteUrl}/`, 302);
});

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
