import { Hono } from "hono";
import { createError, createSuccess, ReasonPhrases } from "@/utils/respond";
import { requireAuth, getCurrentUser } from "@/utils/session";
import { getUserByGithubLogin } from "@/utils/sql";

const users = new Hono<{ Bindings: CloudflareBindings }>();

const PUBLIC_FIELDS = `
    id, github_id, github_login, display_name, email, avatar_url, bio, role, created_at, last_login_at
`;

// PATCH /api/v1/users/me → Update current user profile
users.patch("/me", requireAuth, async (c) => {
    const user = getCurrentUser(c);

    let body: {
        display_name?: string;
        email?: string;
        avatar_url?: string;
        bio?: string;
    };
    try {
        body = await c.req.json();
    } catch {
        return c.json(
            createError(ReasonPhrases.BAD_REQUEST, "Invalid JSON body"),
            400,
        );
    }

    const fields: string[] = [];
    const values: unknown[] = [];

    if (body.display_name !== undefined) {
        fields.push("display_name = ?");
        values.push(body.display_name);
    }
    if (body.email !== undefined) {
        fields.push("email = ?");
        values.push(body.email);
    }
    if (body.avatar_url !== undefined) {
        fields.push("avatar_url = ?");
        values.push(body.avatar_url);
    }
    if (body.bio !== undefined) {
        fields.push("bio = ?");
        values.push(body.bio);
    }

    if (fields.length === 0) {
        return c.json(
            createError(ReasonPhrases.BAD_REQUEST, "No fields to update"),
            400,
        );
    }

    values.push(user.id);
    await c.env.D1.prepare(`UPDATE users SET ${fields.join(", ")} WHERE id = ?`)
        .bind(...values)
        .run();

    const updated = await c.env.D1.prepare(
        `SELECT ${PUBLIC_FIELDS} FROM users WHERE id = ?`,
    )
        .bind(user.id)
        .first();

    return c.json(createSuccess({ user: updated }));
});

// DELETE /api/v1/users/me → Delete current user
users.delete("/me", requireAuth, async (c) => {
    const user = getCurrentUser(c);

    await c.env.D1.prepare("DELETE FROM users WHERE id = ?")
        .bind(user.id)
        .run();

    return c.json(createSuccess({ message: "Account deleted successfully" }));
});

// GET /api/v1/users/:username → Get public user profile
users.get("/:username", async (c) => {
    const username = c.req.param("username");
    const user = await getUserByGithubLogin(c.env.D1, username);

    if (!user) {
        return c.json(
            createError(ReasonPhrases.NOT_FOUND, "User not found"),
            404,
        );
    }

    const { password_hash, ...publicUser } = user;
    return c.json(createSuccess({ user: publicUser }));
});

export default users;
