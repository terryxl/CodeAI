import { type Span } from '@opentelemetry/api';
/**
 * Adds OpenTelemetry event to the current active span in the development environment.
 * Does nothing in production environments.
 *
 * If `currentLinePrefix` and `text` attributes are present,
 * merges them into one formatted attribute (useful for autocomplete events logging).
 */
export declare const addAutocompleteDebugEvent: (name: string, attributes?: Record<string, unknown>) => Span | undefined;
//# sourceMappingURL=debug-utils.d.ts.map