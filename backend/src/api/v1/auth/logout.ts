import { Hono } from "hono";
import { verifyToken } from "../../../utils/verifyToken";
import { createSuccess } from "../../../utils/json_resp";

const logout = new Hono<{ Bindings: CloudflareBindings }>();

logout.post("/", async (c) => {
    const D1 = c.env.D1;
    const auth = await verifyToken(c);
    if ("error" in auth) {
        return c.json(auth, 401);
    }

    const token = c.req.header("Authorization")?.replace("Bearer ", "");
    await D1.prepare("DELETE FROM users_sessions WHERE token = ?").bind(token).run();

    return c.json(createSuccess({ message: "Logged out successfully", token }), 200);
});

export default logout;
