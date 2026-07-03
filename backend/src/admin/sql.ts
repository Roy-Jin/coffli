import { Hono } from "hono";
import { createError, createSuccess, ReasonPhrases } from "@/utils/respond";

const sql = new Hono<{ Bindings: CloudflareBindings }>();

// POST /admin/sql → Execute one or more SQL statements
sql.post("/", async (c) => {
    const D1 = c.env.D1;

    let body: { sql?: string | string[] };
    try {
        body = await c.req.json();
    } catch {
        return c.json(
            createError(ReasonPhrases.BAD_REQUEST, "Invalid JSON body"),
            400,
        );
    }

    const rawSql = body.sql;
    if (!rawSql || (Array.isArray(rawSql) && rawSql.length === 0)) {
        return c.json(
            createError(ReasonPhrases.BAD_REQUEST, "SQL statement is required"),
            400,
        );
    }

    const statements = Array.isArray(rawSql)
        ? rawSql
        : splitStatements(rawSql);

    const results: unknown[] = [];
    for (const statement of statements) {
        const trimmed = statement.trim();
        if (!trimmed) continue;

        try {
            const result = await executeStatement(D1, trimmed);
            results.push(result);
        } catch (error: any) {
            return c.json(
                createError(
                    ReasonPhrases.INTERNAL_SERVER_ERROR,
                    "Failed to execute SQL statement",
                    {
                        sql: trimmed,
                        error: error.message,
                    },
                ),
                500,
            );
        }
    }

    return c.json(createSuccess({
        message: "SQL executed successfully",
        statements,
        results,
    }));
});

function splitStatements(sql: string): string[] {
    const statements: string[] = [];
    let current = "";
    let inString = false;
    let stringChar = "";

    for (let i = 0; i < sql.length; i++) {
        const char = sql[i];
        const next = sql[i + 1];

        if (!inString && (char === "'" || char === '"' || char === "`")) {
            inString = true;
            stringChar = char;
        } else if (inString && char === stringChar) {
            if (next === stringChar) {
                current += char;
                i++;
                continue;
            }
            inString = false;
            stringChar = "";
        }

        if (!inString && char === ";") {
            statements.push(current);
            current = "";
            continue;
        }

        current += char;
    }

    if (current.trim()) {
        statements.push(current);
    }

    return statements;
}

async function executeStatement(
    D1: D1Database,
    statement: string,
): Promise<unknown> {
    const firstWord = statement
        .replace(/^\s*(--[^\n]*\n|\/\*[\s\S]*?\/)*/g, "")
        .trim()
        .split(/\s+/)[0]
        .toUpperCase();

    const isQuery =
        firstWord === "SELECT" ||
        firstWord === "PRAGMA" ||
        firstWord === "EXPLAIN" ||
        firstWord === "WITH";

    const prepared = D1.prepare(statement);

    if (isQuery) {
        const { results, meta } = await prepared.all();
        return { type: "query", results, meta };
    }

    const { success, meta } = await prepared.run();
    return { type: "command", success, meta };
}

export default sql;
