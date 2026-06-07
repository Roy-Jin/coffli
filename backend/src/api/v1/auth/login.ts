import { Hono } from "hono";
import { createError, createSuccess, ErrorCodes } from "../../../utils/json_resp";
import bcrypt from "bcryptjs";

const login = new Hono<{ Bindings: CloudflareBindings }>();

login.post("/", async (c) => {
    const D1 = c.env.D1;

    const {
        username: _name,
        password: _passwd,
    } = await c.req.json() || {};

    if (!_name || !_passwd) {
        return c.json(
            createError(ErrorCodes.INVALID_INPUT, "username and password are required", {
                username: _name,
                password: _passwd,
            }),
            400,
        );
    }

    const findUserSql = "SELECT * FROM users WHERE username = ?";
    const INFO = await D1.prepare(findUserSql).bind(_name).first();

    if (!INFO) {
        return c.json(
            createError(ErrorCodes.NOT_FOUND, "user not found", {
                username: _name,
            }),
            404,
        );
    }
    let isPasswordValid = false;

    if (typeof INFO.password === "string") {
        isPasswordValid = await bcrypt.compare(_passwd, INFO.password);
    }

    if (!isPasswordValid) {
        return c.json(
            createError(ErrorCodes.INVALID_INPUT, "invalid password"),
            401,
        );
    }

    const loginTime = Date.now();
    const updateLoginSql =
        "UPDATE users SET last_login = ? WHERE username = ?;";
    await D1.prepare(updateLoginSql).bind(loginTime, INFO.username).run();

    const token = crypto.randomUUID();
    const userAgent = c.req.header("User-Agent") || "unknown";
    const insertTokenSql =
        "INSERT INTO users_sessions (token, user_id, device_info, login_time) VALUES (?, ?, ?, ?)";
    await D1.prepare(insertTokenSql).bind(
        token,
        INFO.id,
        userAgent,
        loginTime,
    ).run();

    const { password, ...data } = INFO;
    data.last_login = loginTime;

    return c.json(
        createSuccess(data, { token }),
        200,
    );
});

export default login;
