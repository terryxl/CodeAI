import { type ExportResult } from "@opentelemetry/core";
import { type ReadableSpan, type SpanExporter } from "@opentelemetry/sdk-trace-base";
/**
 * Nests spans using `parentSpanId` fields on a span batch and logs them into the console.
 * Used in the development environment for a faster feedback cycle and better span explorability
 */
export declare class ConsoleBatchSpanExporter implements SpanExporter {
    private formatDuration;
    private nestSpans;
    private logSpanTree;
    export(spans: ReadableSpan[], resultCallback: (result: ExportResult) => void): void;
    shutdown(): Promise<void>;
}
//# sourceMappingURL=console-batch-span-exporter.d.ts.map