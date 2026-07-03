import { Hono } from "hono";
import { createError, createSuccess, ReasonPhrases } from "@/utils/respond";
import { DEFAULT_KV } from "../utils/defaults";
import { initTables } from "@/utils/sql";

const init = new Hono<{ Bindings: CloudflareBindings }>();

// POST /admin/init → initialize database (public, checks INITED flag)
init.all("/", async (c) => {
    const D1 = c.env.D1;
    const KV = c.env.KV;

    try {
        const INITED = await KV.get("INITED");

        if (INITED) {
            return c.json(createSuccess({
                message: "Service already initialized",
            }));
        }

        for (const key in DEFAULT_KV) {
            await KV.put(key, DEFAULT_KV[key as keyof typeof DEFAULT_KV]);
        }
        const createResults = await initTables(D1);
        return c.json(createSuccess({
            message: "Service initialized successfully",
            data: {
                kv: DEFAULT_KV,
                d1: createResults,
            },
        }));
    } catch (error: any) {
        return c.json(
            createError(
                ReasonPhrases.INTERNAL_SERVER_ERROR,
                "Failed to initialize service",
                { detail: error.message },
            ),
            500,
        );
    }
});

export default init;
