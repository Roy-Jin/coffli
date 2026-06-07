import { Hono } from "hono";
import check_maintenance from "./middleware/maintenance";
import { createError } from "./utils/json_resp";

import admin from "./admin";
import api from "./api";

type Bindings = CloudflareBindings & { ASSETS: Fetcher };
const app = new Hono<{ Bindings: Bindings }>();

app.route("/admin", admin); // 管理类路由（最高优先级）

//--------------
//   中间件注册
//--------------

app.use("/api/*", check_maintenance); // 检查维护模式

//------------
//   路由注册
//------------

app.route("/api", api); //  API 路由

// 未匹配的路由：回退到 Pages 静态资源服务
// 在 Pages Functions 环境中 env.ASSETS 可用，在本地 wrangler dev 中不可用则返回 404
app.all("*", async (c) => {
    if (c.env.ASSETS) {
        return c.env.ASSETS.fetch(c.req.raw);
    }
    return c.json(createError("NOT_FOUND", "Route not found"), 404);
});

export default app;