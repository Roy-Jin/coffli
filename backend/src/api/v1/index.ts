import { Hono } from "hono";

import auth from "./auth";
import user from "./users";
import posts from "./posts";
import guestbook from "./guestbook";

const v1 = new Hono();

//-------------------
//    V1 API 管理类
//-------------------

v1.route("/auth", auth); // 认证
v1.route("/users", user); // 用户
v1.route("/posts", posts); // 博客
v1.route("/guestbook", guestbook); // 留言板

export default v1;
