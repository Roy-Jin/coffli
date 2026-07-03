import { Hono } from "hono";
import { createError, createSuccess, ReasonPhrases } from "@/utils/respond";
import { DEFAULT_KV, getDefault, isManagedKey } from "@/utils/defaults";

const kv = new Hono<{ Bindings: CloudflareBindings }>();

kv.on("GET", ["/ls", "/list"], async (c) => {
    const KV = c.env.KV;
    const list = await KV.list();
    return c.json(createSuccess({
        keys: list.keys,
    }));
});

kv.get("/defaults", (c) => {
    return c.json(createSuccess({
        keys: Object.entries(DEFAULT_KV).map(([name, value]) => ({
            name,
            value,
        })),
    }));
});

kv.get("/:key/default", (c) => {
    const key = c.req.param("key");
    if (!isManagedKey(key)) {
        return c.json(
            createError(
                ReasonPhrases.NOT_FOUND,
                "No default value for this key",
                { key },
            ),
            404,
        );
    }
    return c.json(createSuccess({
        key,
        value: getDefault(key),
    }));
});

kv.get("/:key", async (c) => {
    const KV = c.env.KV;
    const key = c.req.param("key");
    const value = await KV.get(key);
    if (value === null) {
        return c.json(
            createError(ReasonPhrases.NOT_FOUND, "Key not found", {
                key: key,
            }),
            404,
        );
    }
    return c.json(createSuccess({
        key: key,
        value: value,
    }));
});

// POST / PUT 均按 "创建或更新" 处理（upsert 语义）
kv.on(["PUT", "POST"], "/:key", async (c) => {
    const KV = c.env.KV;
    const key = c.req.param("key");
    let body: unknown;
    try {
        body = await c.req.json();
    } catch {
        return c.json(
            createError(ReasonPhrases.BAD_REQUEST, "Invalid JSON body"),
            400,
        );
    }
    const { value } = (body ?? {}) as { value?: unknown };

    if (!key || value === undefined || value === null) {
        return c.json(
            createError(
                ReasonPhrases.BAD_REQUEST,
                "Key or value is missing",
            ),
            400,
        );
    }

    await KV.put(key, value as string);
    return c.json(createSuccess({
        key: key,
        value: value,
    }));
});

kv.delete("/:key", async (c) => {
    const KV = c.env.KV;
    const key = c.req.param("key");

    if (!key) {
        return c.json(
            createError(ReasonPhrases.BAD_REQUEST, "Key is missing"),
            400,
        );
    }

    if ((await KV.get(key)) === null) {
        return c.json(
            createError(ReasonPhrases.NOT_FOUND, "Key not found", {
                key: key,
            }),
            404,
        );
    }

    await KV.delete(key);
    return c.json(createSuccess({
        key: key,
    }));
});

export default kv;
