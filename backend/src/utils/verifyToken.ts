import { Context } from "hono";
import { createError, ErrorCodes, ErrorResponse } from "./json_resp";

type AuthResult = { valid: true; userId: number } | ErrorResponse;

/**
 * 验证 Bearer token，成功返回 `{ valid: true, userId }`，失败返回 `ErrorResponse`
 * 调用方通过 `"error" in auth` 判断失败，通过 `auth.userId` 获取用户 ID
 */
async function verifyToken(
    c: Context,
): Promise<AuthResult> {
    if (!c.req.header("Authorization")) {
        return createError(ErrorCodes.UNAUTHORIZED, "authorization header missing");
    } else if (!c.req.header("Authorization")?.startsWith("Bearer ")) {
        return createError(ErrorCodes.UNAUTHORIZED, "invalid authorization header");
    }

    const token = c.req.header("Authorization")?.replace("Bearer ", "");
    const D1 = c.env.D1;

    const session = await D1.prepare(
        "SELECT user_id FROM users_sessions WHERE token = ?",
    ).bind(token).first() as { user_id: number } | null;

    if (session) {
        return { valid: true, userId: session.user_id };
    }

    return createError(ErrorCodes.UNAUTHORIZED, "invalid token", { token });
}

export { verifyToken };
export type { AuthResult };
