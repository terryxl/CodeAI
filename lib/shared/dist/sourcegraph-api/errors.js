import { differenceInDays, format, formatDistanceStrict, formatRelative } from 'date-fns';
import { isError } from '../utils';
function formatRetryAfterDate(retryAfterDate) {
    const now = new Date();
    if (differenceInDays(retryAfterDate, now) < 7) {
        return `Usage will reset ${formatRelative(retryAfterDate, now)}`;
    }
    return `Usage will reset in ${formatDistanceStrict(retryAfterDate, now)} (${format(retryAfterDate, 'P')} at ${format(retryAfterDate, 'p')})`;
}
export class RateLimitError extends Error {
    feature;
    message;
    upgradeIsAvailable;
    limit;
    retryAfter;
    static errorName = 'RateLimitError';
    name = RateLimitError.errorName;
    userMessage;
    retryAfterDate;
    retryMessage;
    constructor(feature, message, 
    /* Whether an upgrade is available that would increase rate limits. */
    upgradeIsAvailable, limit, 
    /* The value of the `retry-after` header */
    retryAfter) {
        super(message);
        this.feature = feature;
        this.message = message;
        this.upgradeIsAvailable = upgradeIsAvailable;
        this.limit = limit;
        this.retryAfter = retryAfter;
        this.userMessage = `You've used all ${feature} for ${upgradeIsAvailable ? 'the month' : 'today'}.`;
        this.retryAfterDate = retryAfter
            ? /^\d+$/.test(retryAfter)
                ? new Date(Date.now() + parseInt(retryAfter, 10) * 1000)
                : new Date(retryAfter)
            : undefined;
        this.retryMessage = this.retryAfterDate ? formatRetryAfterDate(this.retryAfterDate) : undefined;
    }
}
/*
For some reason `error instanceof RateLimitError` was not enough.
`isRateLimitError` returned `false` for some cases.
In particular, 'autocomplete/execute' in `agent.ts` and was affected.
It was required to add `(error as any)?.name === RateLimitError.errorName`.
 *  */
export function isRateLimitError(error) {
    return error instanceof RateLimitError || error?.name === RateLimitError.errorName;
}
export class TracedError extends Error {
    traceId;
    constructor(message, traceId) {
        super(message);
        this.traceId = traceId;
    }
}
export class NetworkError extends Error {
    traceId;
    status;
    constructor(response, content, traceId) {
        super(`Request to ${response.url} failed with ${response.status} ${response.statusText}: ${content}`);
        this.traceId = traceId;
        this.status = response.status;
    }
}
export function isNetworkError(error) {
    return error instanceof NetworkError;
}
export function isAuthError(error) {
    return error instanceof NetworkError && (error.status === 401 || error.status === 403);
}
export class AbortError extends Error {
    // Added to make TypeScript understand that AbortError is not the same as Error.
    isAbortError = true;
}
export function isAbortError(error) {
    return (isError(error) &&
        // custom abort error
        ((error instanceof AbortError && error.isAbortError) ||
            // http module
            error.message === 'aborted' ||
            // fetch
            error.message.includes('The operation was aborted') ||
            error.message.includes('The user aborted a request')));
}
export class TimeoutError extends Error {
}
//# sourceMappingURL=errors.js.map