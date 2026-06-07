/**
 * 成功响应结构
 */
export interface SuccessResponse<T = unknown> {
    data: T;
    meta?: Record<string, unknown>;
}

/**
 * 错误响应结构
 */
export interface ErrorResponse {
    error: {
        code: string; // 机器可读错误码 (e.g. "VALIDATION_ERROR")
        message: string; // 人类可读描述
        details?: unknown; // 调试细节 (可选)
        status?: number; // HTTP 状态码 (可选，Hono 会单独设置)
    };
}

/**
 * 预定义错误码常量
 */
export const ErrorCodes = {
    BAD_REQUEST: "BAD_REQUEST",
    UNAUTHORIZED: "UNAUTHORIZED",
    FORBIDDEN: "FORBIDDEN",
    NOT_FOUND: "NOT_FOUND",
    CONFLICT: "CONFLICT",
    ALREADY_EXISTS: "ALREADY_EXISTS",
    INVALID_INPUT: "INVALID_INPUT",
    MISSING_PARAM: "MISSING_PARAM",
    SQL_ERROR: "SQL_ERROR",
    INIT_ERROR: "INIT_ERROR",
    RESET_ERROR: "RESET_ERROR",
} as const;

/**
 * 创建成功响应
 * @example
 * createSuccess({ id: 1, title: 'Hello' })
 * createSuccess(posts, { pagination: { page: 1, total: 100 } })
 */
export function createSuccess<T>(
    data: T,
    meta?: Record<string, unknown>,
): SuccessResponse<T> {
    return {
        data,
        ...(meta && { meta }),
    };
}

/**
 * 创建错误响应
 * @example
 * createError('NOT_FOUND', 'Post not found', { id: 123 })
 * createError('INVALID_INPUT', 'Email is invalid', { field: 'email', value: 'bad' })
 */
export function createError(
    code: string,
    message: string,
    details?: unknown,
): ErrorResponse {
    return {
        error: {
            code,
            message,
            ...(details !== undefined && { details }),
        },
    };
}
