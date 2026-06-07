import { Hono } from "hono";
import { basicAuth } from "hono/basic-auth";
import bcrypt from "bcryptjs";

import init from "./init";
import sql from "./sql";
import kv from "./kv";
import op from "./op";

const admin = new Hono<{ Bindings: CloudflareBindings }>();

admin.use(basicAuth({
    verifyUser: async (u, p, c) => {
        let BASIC_AUTH = await c.env.KV.get("BASIC_AUTH");
        if (!BASIC_AUTH) BASIC_AUTH = `root:passwd`;
        const USERS = BASIC_AUTH.split(";");
        for (let i = 0; i < USERS.length; i++) {
            let [username, password] = USERS[i].split(":");
            [username, password] = [username.trim(), password.trim()];
            if (username.toLowerCase() !== u.toLowerCase()) continue;
            // 先尝试 bcrypt 比较（新格式）
            if (password.startsWith("$2")) {
                if (await bcrypt.compare(p, password)) return true;
            } else {
                // 向后兼容明文密码
                if (password === p) return true;
            }
        }

        return false;
    },
}));

// POST         /admin/init             → 初始化数据库
// POST         /admin/sql              → 运行 SQL 语句
//
// GET          /admin/kv               → 获取所有键值对的名称
// GET          /admin/kv/list (ls)     → 获取所有键值对的名称
// GET          /admin/kv/{key}         → 获取键值对
// POST, PUT    /admin/kv/{key}         → 设置键值对
// DELETE       /admin/kv/{key}         → 删除键值对
//
// POST         /admin/op/{username}          → 添加管理员
// PUT          /admin/op/{username}          → 修改管理员
// GET          /admin/op/{username}          → 获取管理员信息
// DELETE       /admin/op/{username}          → 删除管理员

admin.all("/ok", async (c) => c.json({ ok: true }));
admin.route("/init", init);
admin.route("/sql", sql);
admin.route("/kv", kv);
admin.route("/op", op);

export default admin;
