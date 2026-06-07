import { Hono } from "hono";
import { createError, createSuccess, ErrorCodes } from "../utils/json_resp";

const kv = new Hono<{ Bindings: CloudflareBindings }>();

kv.on("GET", ["/", "/ls", "/list"], async (c) => {
    const KV = c.env.KV;
    const list = await KV.list();
    return c.json(createSuccess({
        keys: list.keys,
    }));
});

kv.get("/:key", async (c) => {
    const KV = c.env.KV;
    const key = c.req.param("key");
    const value = await KV.get(key);
    if (!key || !value) {
        return c.json(
            createError(ErrorCodes.NOT_FOUND, "Key not found", { key: key }),
            404,
        );
    }
    return c.json(createSuccess({
        key: key,
        value: value,
    }));
});

kv.on(["PUT", "POST"], "/:key", async (c) => {
    const KV = c.env.KV;
    const key = c.req.param("key");
    const { value } = await c.req.json();

    if (!key || !value) {
        return c.json(
            createError(ErrorCodes.BAD_REQUEST, "Key or value is missing"),
            400,
        );
    }

    await KV.put(key, value);
    return c.json(createSuccess({
        key: key,
        value: value,
    }));
});

kv.delete("/:key", async (c) => {
    const KV = c.env.KV;
    const key = c.req.param("key");
    await KV.delete(key);
    return c.json(createSuccess({
        key: key,
    }));
});

export default kv;
