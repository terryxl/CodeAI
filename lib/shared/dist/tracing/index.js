import opentelemetry, { SpanStatusCode, context, propagation } from '@opentelemetry/api';
const INSTRUMENTATION_SCOPE_NAME = 'cody';
const INSTRUMENTATION_SCOPE_VERSION = '0.1';
export const tracer = opentelemetry.trace.getTracer(INSTRUMENTATION_SCOPE_NAME, INSTRUMENTATION_SCOPE_VERSION);
export function getActiveTraceAndSpanId() {
    const activeSpan = opentelemetry.trace.getActiveSpan();
    if (activeSpan) {
        const context = activeSpan.spanContext();
        return {
            traceId: context.traceId,
            spanId: context.spanId,
        };
    }
    return undefined;
}
export function wrapInActiveSpan(name, fn) {
    return tracer.startActiveSpan(name, (span) => {
        const handleSuccess = (response) => {
            span.setStatus({ code: SpanStatusCode.OK });
            span.end();
            return response;
        };
        const handleError = (error) => {
            recordErrorToSpan(span, error);
            throw error;
        };
        try {
            const response = fn(span);
            if (typeof response === 'object' && response !== null && 'then' in response) {
                // @ts-ignore Response seems to be a Thenable
                return response.then(handleSuccess, handleError);
            }
            return handleSuccess(response);
        }
        catch (error) {
            return handleError(error);
        }
    });
}
/**
 * Create a Trace Context compliant traceparent header value.
 * c.f. https://www.w3.org/TR/trace-context/#examples-of-http-traceparent-headers
 */
export function addTraceparent(headers) {
    propagation.inject(context.active(), headers, {
        set(carrier, key, value) {
            carrier.set(key, value);
        },
    });
}
export function getTraceparentHeaders() {
    const headers = {};
    propagation.inject(context.active(), headers, {
        set(carrier, key, value) {
            carrier[key] = value;
        },
    });
    return headers;
}
export function recordErrorToSpan(span, error) {
    span.recordException(error);
    span.setStatus({ code: SpanStatusCode.ERROR });
    span.end();
    return error;
}
//# sourceMappingURL=index.js.map