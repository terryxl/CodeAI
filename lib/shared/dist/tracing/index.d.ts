import { type Span } from '@opentelemetry/api';
export declare const tracer: import("@opentelemetry/api").Tracer;
export declare function getActiveTraceAndSpanId(): {
    traceId: string;
    spanId: string;
} | undefined;
export declare function wrapInActiveSpan<R>(name: string, fn: (span: Span) => R): R;
/**
 * Create a Trace Context compliant traceparent header value.
 * c.f. https://www.w3.org/TR/trace-context/#examples-of-http-traceparent-headers
 */
export declare function addTraceparent(headers: Headers): void;
export declare function getTraceparentHeaders(): {
    [key: string]: string;
};
export declare function recordErrorToSpan(span: Span, error: Error): Error;
//# sourceMappingURL=index.d.ts.map