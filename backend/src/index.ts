import { Hono } from "hono";

import admin from "@/admin";
import api from "@/api";

type Bindings = CloudflareBindings & { ASSETS: Fetcher };
const app = new Hono<{ Bindings: Bindings }>();

app.route("/admin", admin); // 管理类路由（最高优先级）
app.route("/api", api); //  API 路由

app.all("*", async (c) => {
    if (c.env.ASSETS) return c.env.ASSETS.fetch(c.req.raw);
    return c.notFound();
});

export default app;
