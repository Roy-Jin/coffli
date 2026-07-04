import { getSignedCookie, setSignedCookie, deleteCookie } from "hono/cookie";
import { createMiddleware } from "hono/factory";
import type { Context } from "hono";
import { createError, ReasonPhrases } from "@/utils/respond";
import { createSession, getSession, getUserById, deleteSession } from "@/utils/sql";
import type { User } from "@/types/sql";

type Env = { Bindings: CloudflareBindings };

declare module "hono" {
    interface ContextVariableMap {
        user: User;
    }
}

const SESSION_COOKIE = "session_id";
const SESSION_TTL_DAYS = 7;

async function getSecret(c: Context<Env>): Promise<string> {
    const secret = await c.env.KV.get("SESSION_SECRET");
    if (!secret) {
        throw new Error("SESSION_SECRET is not configured in KV");
    }
    return secret;
}

export async function getSessionId(c: Context<Env>): Promise<string | undefined> {
    const value = await getSignedCookie(c, await getSecret(c), SESSION_COOKIE);
    return value || undefined;
}

export async function createUserSession(
    c: Context<Env>,
    userId: number,
): Promise<string> {
    const sessionId = crypto.randomUUID();
    const expiresAt = new Date(
        Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000,
    ).toISOString().slice(0, 19).replace("T", " ");

    await createSession(c.env.D1, {
        id: sessionId,
        user_id: userId,
        expires_at: expiresAt,
        ip_address: c.req.header("CF-Connecting-IP") ||
            c.req.header("X-Forwarded-For") || undefined,
        user_agent: c.req.header("User-Agent") || undefined,
    });

    const isHttps = c.req.url.startsWith("https://");
    await setSignedCookie(c, SESSION_COOKIE, sessionId, await getSecret(c), {
        httpOnly: true,
        secure: isHttps,
        sameSite: "Lax",
        path: "/",
        maxAge: SESSION_TTL_DAYS * 24 * 60 * 60,
    });

    return sessionId;
}

export async function clearUserSession(
    c: Context<Env>,
    D1: D1Database,
): Promise<void> {
    const sessionId = await getSessionId(c);
    if (sessionId) {
        await deleteSession(D1, sessionId);
    }
    deleteCookie(c, SESSION_COOKIE, { path: "/" });
}

export const requireAuth = createMiddleware<Env>(async (c, next) => {
    const sessionId = await getSignedCookie(
        c,
        await getSecret(c),
        SESSION_COOKIE,
    );

    if (!sessionId) {
        return c.json(
            createError(ReasonPhrases.UNAUTHORIZED, "Authentication required"),
            401,
        );
    }

    const session = await getSession(c.env.D1, sessionId);
    if (!session) {
        deleteCookie(c, SESSION_COOKIE, { path: "/" });
        return c.json(
            createError(ReasonPhrases.UNAUTHORIZED, "Session expired or invalid"),
            401,
        );
    }

    const user = await getUserById(c.env.D1, session.user_id);
    if (!user) {
        await deleteSession(c.env.D1, sessionId);
        deleteCookie(c, SESSION_COOKIE, { path: "/" });
        return c.json(
            createError(ReasonPhrases.UNAUTHORIZED, "User not found"),
            401,
        );
    }

    c.set("user", user);
    await next();
});

export function getCurrentUser(c: Context<Env>): User {
    return c.get("user");
}

export async function getCurrentUserOptional(
    c: Context<Env>,
): Promise<User | null> {
    const sessionId = await getSessionId(c);
    if (!sessionId) return null;
    const session = await getSession(c.env.D1, sessionId);
    if (!session) return null;
    return await getUserById(c.env.D1, session.user_id);
}

export const optionalAuth = createMiddleware<Env>(async (c, next) => {
    const user = await getCurrentUserOptional(c);
    if (user) c.set("user", user);
    await next();
});
