import { Hono } from "hono";

const auth = new Hono();

// POST    /api/v1/auth/register    → 注册
// POST    /api/v1/auth/login       → 登录
// POST    /api/v1/auth             → 验证（需认证）
// POST    /api/v1/auth/logout      → 登出（需认证）

// 注册
import register from "./register";
auth.route("/register", register);

// 登录
import login from "./login";
auth.route("/login", login);

// 验证
import root from "./root";
auth.route("/", root);

// 登出
import logout from "./logout";
auth.route("/logout", logout);

export default auth;
