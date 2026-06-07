import { Hono } from "hono";
import { createError, createSuccess, ErrorCodes } from "../../../utils/json_resp";
import { verifyToken } from "../../../utils/verifyToken";

const uDel = new Hono<{ Bindings: CloudflareBindings }>();

// DELETE   /api/v1/users/{username}          → 删除用户（软删、需认证）
uDel.delete("/:username", async (c) => {
    const username = c.req.param("username");
    const D1 = c.env.D1;
    const R2 = c.env.R2;

    const auth = await verifyToken(c);
    if ("error" in auth) {
        return c.json(auth, 401);
    }

    // 校验用户归属：只能删除自己的账号
    const targetUser = await D1.prepare(
        "SELECT id FROM users WHERE username = ?",
    ).bind(username).first() as { id: number } | null;

    if (!targetUser || targetUser.id !== auth.userId) {
        return c.json(createError(ErrorCodes.FORBIDDEN, "you can only delete your own account"), 403);
    }

    const newName = `${username}-${Date.now()}-deleted`;

    await D1.prepare(
        "UPDATE users SET username = ?, active = ?, deleted_at = ? WHERE username = ?;",
    ).bind(newName, false, Date.now(), username).run();

    await R2.delete(`avatar/${username}`);

    return c.json(createSuccess("User deleted successfully"), 200);
});

export default uDel;
