import { Hono } from "hono";
import { basicAuth } from "hono/basic-auth";
import { createSuccess } from "@/utils/respond";

import init from "./init";
import sql from "./sql";
import kv from "./kv";

type Bindings = CloudflareBindings & { ASSETS: Fetcher };

const admin = new Hono<{ Bindings: Bindings }>();

// KV-based Basic Auth on all admin routes
admin.use(
    "/*",
    basicAuth({
        verifyUser: async (username, password, c) => {
            const BASIC_AUTH = await c.env.KV.get("BASIC_AUTH") ||
                "COFFLI:PASSWD";
            const entries = BASIC_AUTH.split(";");
            for (const entry of entries) {
                const [u, p] = entry.split(":").map((s: string) => s.trim());
                if (
                    u.toLowerCase() === username.toLowerCase() && p === password
                ) {
                    return true;
                }
            }
            return false;
        },
    }),
);

// API routes
admin.all("/ok", (c) => c.json(createSuccess({ message: "OK" })));
admin.route("/init", init);
admin.route("/sql", sql);
admin.route("/kv", kv);

// SPA fallback — serve static assets for non-API GET routes
admin.all("*", async (c) => {
    if (c.env.ASSETS) return c.env.ASSETS.fetch(c.req.raw);
    return c.notFound();
});

export default admin;
