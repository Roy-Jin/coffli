import { Hono } from "hono";
import { verifyToken } from "../../../utils/verifyToken";
import { createSuccess } from "../../../utils/json_resp";

const users = new Hono<{ Bindings: CloudflareBindings }>();

users.get("/", async (c) => {
    const D1 = c.env.D1;
    const auth = await verifyToken(c);
    if ("error" in auth) {
        return c.json(auth, 401);
    }

    const token = c.req.header("Authorization")?.replace("Bearer ", "");

    await D1.prepare(
        "UPDATE users SET last_login = ? WHERE id = ?",
    ).bind(Date.now(), auth.userId).run();

    return c.json(createSuccess({ user_id: auth.userId, token }), 200);
});

export default users;
