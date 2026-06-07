import { Hono } from "hono";
import { cors } from "hono/cors";
import check_maintenance from "./middleware/maintenance";
import { createError } from "./utils/json_resp";

import admin from "./admin";
import api from "./api";

const app = new Hono<{ Bindings: CloudflareBindings }>();

app.route("/admin", admin); // 管理类路由（最高优先级）

//--------------
//   中间件注册
//--------------

app.use(cors()); // CORS 跨域
app.use(
    "/favicon.ico",
    async (c) => {
        return c.redirect("https://coffli.pages.dev/favicon.ico");
    },
);
app.use("/api/*", check_maintenance); // 检查维护模式

//------------
//   路由注册
//------------

app.route("/api", api); //  API 路由

// 404
app.all("*", (c) => c.json(createError("NOT_FOUND", "Route not found"), 404));

export default app;