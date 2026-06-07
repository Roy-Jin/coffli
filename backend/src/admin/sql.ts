import { Hono } from "hono";
import { createError, createSuccess, ErrorCodes } from "../utils/json_resp";

const sql = new Hono<{ Bindings: CloudflareBindings }>();

// POST  /admin/sql   → 运行 SQL 语句
sql.post("/", async (c) => {
    const D1 = c.env.D1;

    try {
        const { sql: sqlStatement } = await c.req.json();

        if (!sqlStatement) {
            return c.json(
                createError(ErrorCodes.BAD_REQUEST, "SQL statement is required"),
                400,
            );
        }

        // 执行 SQL 语句
        const result = await D1.prepare(sqlStatement).all();

        return c.json(createSuccess({
            message: "SQL executed successfully",
            sql: sqlStatement,
            result: result,
        }));
    } catch (error: any) {
        return c.json(
            createError(ErrorCodes.SQL_ERROR, "Failed to execute SQL statement", {
                error: error.message,
            }),
            500,
        );
    }
});

export default sql;
