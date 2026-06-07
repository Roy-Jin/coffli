import { createMiddleware } from "hono/factory";
import marked from "../utils/marked";

const check_maintenance = createMiddleware(async (c, next) => {
    const MAINTENANCE_MODE = (await c.env.KV.get("MAINTENANCE_MODE")) || "";
    const MAINTENANCE_MESSAGE = (await c.env.KV.get("MAINTENANCE_MESSAGE")) ||
        "503 Service Unavailable";
    if (MAINTENANCE_MODE) {
        return c.html(
            marked(
                `<div align="center" style="color:brown;">%MAINTENANCE_MESSAGE%</div>`
                    .replace("%MAINTENANCE_MESSAGE%", MAINTENANCE_MESSAGE),
            ),
            503,
        );
    }
    return await next();
});

export default check_maintenance;
