import { Hono } from "hono";
import { createError, createSuccess, ErrorCodes } from "../utils/json_resp";
import bcrypt from "bcryptjs";

const op = new Hono<{ Bindings: CloudflareBindings }>();

// POST     /admin/op/{username}          → 添加管理员（注册，要设置密码）
op.post("/:username", async (c) => {
    const KV = c.env.KV;
    const username = c.req.param("username");
    const { password } = await c.req.json();
    
    if (!username || !password) {
        return c.json(
            createError(ErrorCodes.BAD_REQUEST, "Username or password is missing"),
            400,
        );
    }

    // 获取现有的管理员列表
    let BASIC_AUTH = await KV.get("BASIC_AUTH");
    if (!BASIC_AUTH) BASIC_AUTH = "root:passwd";

    // 检查用户名是否已存在
    const users = BASIC_AUTH.split(";");
    for (const user of users) {
        const [existingUsername] = user.split(":");
        if (existingUsername.trim().toLowerCase() === username.toLowerCase()) {
            return c.json(
                createError(ErrorCodes.CONFLICT, "Username already exists", { username }),
                409,
            );
        }
    }

    // 添加新用户（密码 bcrypt 哈希）
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = `${username}:${hashedPassword}`;
    const updatedAuth = BASIC_AUTH ? `${BASIC_AUTH};${newUser}` : newUser;

    await KV.put("BASIC_AUTH", updatedAuth);

    return c.json(createSuccess({
        message: "Admin user created successfully",
        username: username,
    }), 201);
});

// PUT      /admin/op/{username}          → 修改管理员（修改密码）
op.put("/:username", async (c) => {
    const KV = c.env.KV;
    const username = c.req.param("username");
    const { password } = await c.req.json();
    
    if (!username || !password) {
        return c.json(
            createError(ErrorCodes.BAD_REQUEST, "Username or password is missing"),
            400,
        );
    }

    // 获取现有的管理员列表
    let BASIC_AUTH = await KV.get("BASIC_AUTH");
    if (!BASIC_AUTH) BASIC_AUTH = "root:passwd";

    const users = BASIC_AUTH.split(";");
    let userFound = false;
    const updatedUsers: string[] = [];

    for (const user of users) {
        const [existingUsername, existingPassword] = user.split(":");
        if (existingUsername.trim().toLowerCase() === username.toLowerCase()) {
            // 更新密码（bcrypt 哈希）
            const hashedPassword = await bcrypt.hash(password, 10);
            updatedUsers.push(`${existingUsername}:${hashedPassword}`);
            userFound = true;
        } else {
            updatedUsers.push(user);
        }
    }

    if (!userFound) {
        return c.json(
            createError(ErrorCodes.NOT_FOUND, "Admin user not found", { username }),
            404,
        );
    }

    const updatedAuth = updatedUsers.join(";");
    await KV.put("BASIC_AUTH", updatedAuth);

    return c.json(createSuccess({
        message: "Admin user password updated successfully",
        username: username,
    }));
});

// GET      /admin/op/{username}          → 获取管理员信息
op.get("/:username", async (c) => {
    const KV = c.env.KV;
    const username = c.req.param("username");
    
    if (!username) {
        return c.json(
            createError(ErrorCodes.BAD_REQUEST, "Username is missing"),
            400,
        );
    }

    // 获取现有的管理员列表
    let BASIC_AUTH = await KV.get("BASIC_AUTH");
    if (!BASIC_AUTH) BASIC_AUTH = "root:passwd";

    const users = BASIC_AUTH.split(";");
    for (const user of users) {
        const [existingUsername, existingPassword] = user.split(":");
        if (existingUsername.trim().toLowerCase() === username.toLowerCase()) {
            return c.json(createSuccess({
                username: existingUsername,
                password: existingPassword,
            }));
        }
    }

    return c.json(
        createError(ErrorCodes.NOT_FOUND, "Admin user not found", { username }),
        404,
    );
});

// DELETE   /admin/op/{username}          → 删除管理员（注销）
op.delete("/:username", async (c) => {
    const KV = c.env.KV;
    const username = c.req.param("username");
    
    if (!username) {
        return c.json(
            createError(ErrorCodes.BAD_REQUEST, "Username is missing"),
            400,
        );
    }

    // 获取现有的管理员列表
    let BASIC_AUTH = await KV.get("BASIC_AUTH");
    if (!BASIC_AUTH) BASIC_AUTH = "root:passwd";

    const users = BASIC_AUTH.split(";");
    const updatedUsers: string[] = [];
    let userFound = false;

    for (const user of users) {
        const [existingUsername] = user.split(":");
        if (existingUsername.trim().toLowerCase() === username.toLowerCase()) {
            userFound = true;
        } else {
            updatedUsers.push(user);
        }
    }

    if (!userFound) {
        return c.json(
            createError(ErrorCodes.NOT_FOUND, "Admin user not found", { username }),
            404,
        );
    }

    const updatedAuth = updatedUsers.join(";");
    await KV.put("BASIC_AUTH", updatedAuth);

    return c.json(createSuccess({
        message: "Admin user deleted successfully",
        username: username,
    }));
});

export default op;
