import { Hono } from "hono";
import { createError, createSuccess, ErrorCodes } from "../../../utils/json_resp";
import { verifyToken } from "../../../utils/verifyToken";

const uUpdate = new Hono<{ Bindings: CloudflareBindings }>();

// PATCH    /api/v1/users/{username}          → 更新用户信息（需认证）
uUpdate.patch("/:username", async (c) => {
    const username = c.req.param("username");
    const D1 = c.env.D1;

    const auth = await verifyToken(c);
    if ("error" in auth) {
        return c.json(auth, 401);
    }

    // 校验用户归属：只能修改自己的信息
    const targetUser = await D1.prepare(
        "SELECT id FROM users WHERE username = ?",
    ).bind(username).first() as { id: number } | null;

    if (!targetUser || targetUser.id !== auth.userId) {
        return c.json(createError(ErrorCodes.FORBIDDEN, "you can only update your own profile"), 403);
    }

    const { nickname, gender, info } = await c.req.json();
    const updateFields: string[] = [];
    const bindParams: any[] = [];

    if (nickname !== undefined) {
        updateFields.push("nickname = ?");
        bindParams.push(nickname);
    }

    if (gender !== undefined) {
        updateFields.push("gender = ?");
        bindParams.push(gender);
    }

    if (info !== undefined) {
        updateFields.push("info = ?");
        bindParams.push(JSON.stringify(info));
    }

    if (updateFields.length === 0) {
        return c.json(createError(ErrorCodes.BAD_REQUEST, "no fields to update"), 400);
    }

    const userUpdateSql = `UPDATE users SET ${
        updateFields.join(", ")
    } WHERE username = ?;`;
    bindParams.push(username);
    await D1.prepare(userUpdateSql).bind(...bindParams).first();

    const getUserSql = `SELECT * FROM users WHERE username = ?;`;
    const INFO = await D1.prepare(getUserSql).bind(username).first();

    return c.json(createSuccess(INFO), 200);
});

// PUT      /api/v1/users/{username}/avatar   → 更新用户头像（需认证）
uUpdate.put("/:username/avatar", async (c) => {
    const username = c.req.param("username");
    const D1 = c.env.D1;
    const R2 = c.env.R2;

    const auth = await verifyToken(c);
    if ("error" in auth) {
        return c.json(auth, 401);
    }

    // 校验用户归属
    const targetUser = await D1.prepare(
        "SELECT id FROM users WHERE username = ?",
    ).bind(username).first() as { id: number } | null;

    if (!targetUser || targetUser.id !== auth.userId) {
        return c.json(createError(ErrorCodes.FORBIDDEN, "you can only update your own avatar"), 403);
    }

    const file = await c.req.blob();

    if (file === null) {
        return c.json(createError(ErrorCodes.BAD_REQUEST, "no file provided"), 400);
    } else if (file.size > (25 * 1024)) {
        // 刻意限制 25KB：头像仅作为标识，压缩后绰绰有余，拒绝大文件占用 R2 存储
        console.log(file.size / 1024);
        return c.json(createError(ErrorCodes.BAD_REQUEST, "file too large"), 413);
    }

    await R2.put(`avatar/${username}`, file, {
        httpMetadata: { contentType: file.type },
    });
    await D1.prepare(`UPDATE users SET avatar = ? WHERE username = ?;`).bind(
        true,
        username,
    ).run();
    return c.json(createSuccess("Avatar updated"), 200);
});

export default uUpdate;
