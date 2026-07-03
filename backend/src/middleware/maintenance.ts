import { createError, ReasonPhrases } from "@/utils/respond";
import { createMiddleware } from "hono/factory";

const check_maintenance = createMiddleware<{ Bindings: CloudflareBindings }>(
    async (c, next) => {
        const INITED = await c.env.KV.get("INITED");
        if (!INITED) {
            return c.json(
                createError(
                    ReasonPhrases.SERVICE_UNAVAILABLE,
                    "Service is not initialized.",
                ),
                503,
            );
        }
        const MAINTENANCE_MODE = (await c.env.KV.get("MAINTENANCE_MODE")) || "OFF";
        if (MAINTENANCE_MODE === "ON") {
            const MAINTENANCE_MESSAGE =
                (await c.env.KV.get("MAINTENANCE_MESSAGE")) ||
                "503 Service Unavailable";
            return c.json(
                createError(
                    ReasonPhrases.SERVICE_UNAVAILABLE,
                    MAINTENANCE_MESSAGE,
                ),
                503,
            );
        }
        return await next();
    },
);

export default check_maintenance;
