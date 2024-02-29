import type { BrowserOrNodeResponse } from './graphql/client';
export declare class RateLimitError extends Error {
    readonly feature: 'autocompletions' | 'chat messages and commands';
    readonly message: string;
    readonly upgradeIsAvailable: boolean;
    readonly limit?: number | undefined;
    readonly retryAfter?: string | null | undefined;
    static readonly errorName = "RateLimitError";
    readonly name = "RateLimitError";
    readonly userMessage: string;
    readonly retryAfterDate: Date | undefined;
    readonly retryMessage: string | undefined;
    constructor(feature: 'autocompletions' | 'chat messages and commands', message: string, upgradeIsAvailable: boolean, limit?: number | undefined, retryAfter?: string | null | undefined);
}
export declare function isRateLimitError(error: unknown): error is RateLimitError;
export declare class TracedError extends Error {
    traceId: string | undefined;
    constructor(message: string, traceId: string | undefined);
}
export declare class NetworkError extends Error {
    traceId: string | undefined;
    readonly status: number;
    constructor(response: BrowserOrNodeResponse, content: string, traceId: string | undefined);
}
export declare function isNetworkError(error: Error): error is NetworkError;
export declare function isAuthError(error: unknown): boolean;
export declare class AbortError extends Error {
    readonly isAbortError = true;
}
export declare function isAbortError(error: unknown): error is AbortError;
export declare class TimeoutError extends Error {
}
//# sourceMappingURL=errors.d.ts.map