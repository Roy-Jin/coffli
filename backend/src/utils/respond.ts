import { ReasonPhrases } from "http-status-codes";

/**
 * 成功响应结构
 */
export interface SuccessResponse<T = unknown> {
    data: T;
    meta?: Record<string, unknown>;
}

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
 * 错误响应结构
 */
export interface ErrorResponse {
    error: {
        code: string; // 机器可读错误码
        message?: string; // 错误消息
        meta?: Record<string, unknown>; // 错误元数据 (可选)
    };
}

export { ReasonPhrases };

/**
 * 创建错误响应
 * @example
 * createError(ReasonPhrases.NOT_FOUND, 'Post not found', { id: 123 })
 * createError(ReasonPhrases.BAD_REQUEST, 'Email is invalid', { field: 'email', value: 'bad' })
 */
export function createError(
    code: ReasonPhrases,
    message?: string,
    meta?: Record<string, unknown>,
): ErrorResponse {
    return {
        error: {
            code,
            message,
            ...(meta && { meta }),
        },
    };
}
