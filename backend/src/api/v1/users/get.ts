import { Hono } from "hono";
import { createError, createSuccess, ErrorCodes } from "../../../utils/json_resp";

const uGet = new Hono<{ Bindings: CloudflareBindings }>();

// GET      /api/v1/users/{username}          → 获取单个用户
uGet.get("/:username", async (c) => {
    const username = c.req.param("username");
    const D1 = c.env.D1;

    let getUsersSql = "SELECT * FROM users WHERE username = ? AND active = TRUE";

    const result = await D1.prepare(getUsersSql).bind(username).first() as any;
    if (!result) {
        return c.json(createError(ErrorCodes.NOT_FOUND, "User not found"), 404);
    }

    const { password, ...user } = result;

    return c.json(
        createSuccess(user, {
            "username": username,
        }),
        200,
    );
});

// GET      /api/v1/users/{username}/avatar   → 获取用户头像
uGet.get("/:username/avatar", async (c) => {
    const username = c.req.param("username");
    const R2 = c.env.R2;

    const object = await R2.get(`avatar/${username}`);

    if (object === null) {
        return c.json(createError(ErrorCodes.NOT_FOUND, "avatar not found"), 404);
    }

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set("etag", object.httpEtag);
    headers.set("cache-control", "max-age=31536000, public");

    return new Response(object.body, {
        headers,
    });
});

export default uGet;
