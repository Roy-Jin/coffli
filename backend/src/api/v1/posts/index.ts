import { Hono } from "hono";

const posts = new Hono();

// GET      /api/v1/posts             → 获取最新的所有文章（支持分页、过滤）
// GET      /api/v1/posts/{id}        → 获取单篇文章
// GET      /api/v1/posts/users/{id}  → 获取用户的所有文章
// POST     /api/v1/posts             → 创建新文章（需认证）
// PUT      /api/v1/posts/{id}        → 更新文章（需认证）
// DELETE   /api/v1/posts/{id}        → 删除文章（需认证）

// 暂未实现，返回 501
posts.all("*", (c) => c.json({ error: { code: "NOT_IMPLEMENTED", message: "Posts API is not implemented yet" } }, 501));

export default posts;