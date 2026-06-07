import { Hono } from "hono";
import { createError, createSuccess, ErrorCodes } from "../../../utils/json_resp";
import bcrypt from "bcryptjs";

const register = new Hono<{ Bindings: CloudflareBindings }>();

register.post("/", async (c) => {
    const D1 = c.env.D1;
    const {
        username: _name,
        password: _passwd,
        nickname: _nickname,
    } = await c.req.json();

    if (!_name || !_passwd) {
        return c.json(
            createError(ErrorCodes.INVALID_INPUT, "username and password are required", {
                username: _name,
                password: _passwd,
            }),
            400,
        );
    }

    if (!/^[a-zA-Z][a-zA-Z0-9_-]{2,19}$/.test(_name)) {
        return c.json(
            createError(ErrorCodes.INVALID_INPUT, "invalid username format", {
                username: _name,
                rules: "3-20 characters, start with a letter, can only contain letters, numbers, underscores, and hyphens",
            }),
            400,
        );
    }

    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,32}$/.test(_passwd)) {
        return c.json(
            createError(ErrorCodes.INVALID_INPUT, "invalid password format", {
                password: _passwd,
                rules: "8-32 characters, at least one uppercase letter, one lowercase letter, and one number",
            }),
            400,
        );
    }

    const INFO = {
        username: _name,
        password: await bcrypt.hash(_passwd, 10),
        reg_time: Date.now(),
        nickname: _nickname || _name,
    };

    const insertSql = `
            INSERT INTO users (${Object.keys(INFO).join(", ")})
            VALUES (${Object.keys(INFO).map(() => "?").join(", ")});
        `;

    try {
        await D1.prepare(insertSql)
            .bind(...Object.values(INFO))
            .run();
    } catch (e: any) {
        if (e.message.includes("UNIQUE")) {
            return c.json(
                createError(ErrorCodes.ALREADY_EXISTS, "user already exists", {
                    username: _name,
                }),
                409,
            );
        }
    }

    const { password, ...data } = INFO;
    return c.json(
        createSuccess({
            ...data,
        }),
        201,
    );
});

export default register;
