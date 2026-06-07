import { Hono } from "hono";
import { createError, createSuccess, ErrorCodes } from "../utils/json_resp";
import createSQL from "./sql/create_sql";
import deleteSQL from "./sql/delete_sql";
import bcrypt from "bcryptjs";

const init = new Hono<{ Bindings: CloudflareBindings }>();

// ALL /admin/init                 → 初始化数据库
init.all("/", async (c) => {
    const D1 = c.env.D1;
    const KV = c.env.KV;

    try {
        // 执行创建表的 SQL 语句
        await D1.prepare(createSQL).all();

        // 初始化 KV 存储
        const INITED = await KV.get("INITED");
        if (!INITED) {
            await KV.put("BASIC_AUTH", `root:${await bcrypt.hash("passwd", 10)}`);
            await KV.put("MAINTENANCE_MODE", "");
            await KV.put("MAINTENANCE_MESSAGE", "503 Service Unavailable");
            await KV.put("INITED", "true");
        }

        return c.json(createSuccess({
            message: "Database and KV initialized successfully",
            tables_created: ["users", "users_sessions", "users_posts"],
            kv_keys_set: [
                "BASIC_AUTH",
                "MAINTENANCE_MODE",
                "MAINTENANCE_MESSAGE",
            ],
        }));
    } catch (error: any) {
        return c.json(
            createError(ErrorCodes.INIT_ERROR, "Failed to initialize database and KV", {
                error: error.message,
            }),
            500,
        );
    }
});

// ALL /admin/init/reset           → 重置数据库
init.all("/reset", async (c) => {
    const D1 = c.env.D1;
    const KV = c.env.KV;

    try {
        // 执行删除表的 SQL 语句
        await D1.prepare(deleteSQL).all();

        // 重新创建表
        await D1.prepare(createSQL).all();

        // 重置 KV 存储
        await KV.put("BASIC_AUTH", `root:${await bcrypt.hash("passwd", 10)}`);
        await KV.put("MAINTENANCE_MODE", "");
        await KV.put("MAINTENANCE_MESSAGE", "503 Service Unavailable");

        return c.json(createSuccess({
            message: "Database and KV reset successfully",
            tables_reset: ["users", "users_sessions", "users_posts"],
            kv_keys_reset: [
                "BASIC_AUTH",
                "MAINTENANCE_MODE",
                "MAINTENANCE_MESSAGE",
            ],
        }));
    } catch (error: any) {
        return c.json(
            createError(ErrorCodes.RESET_ERROR, "Failed to reset database and kv", {
                error: error.message,
            }),
            500,
        );
    }
});

export default init;
