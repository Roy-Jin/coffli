import { Hono } from "hono";
import { trimTrailingSlash } from "hono/trailing-slash";
import { cors } from "hono/cors";
import check_maintenance from "@/middleware/maintenance";
import { createSuccess } from "@/utils/respond";

import v1 from "./v1";

const api = new Hono();

//--------------
//   中间件注册
//--------------

api.use("*", trimTrailingSlash({ alwaysRedirect: true }));
api.use("*", cors({
    origin: (origin) => origin || "*",
    credentials: true,
}));
api.use("*", check_maintenance); // 检查维护模式

//-------------------
//    API 管理类
//-------------------

api.get("/ok", async (c) => c.json(createSuccess({ message: "OK" })));
api.route("/v1", v1);
api.all("*", async (c) => c.notFound());

export default api;
