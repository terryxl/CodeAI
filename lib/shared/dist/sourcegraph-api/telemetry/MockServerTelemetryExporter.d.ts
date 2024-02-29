import type { TelemetryEventInput, TelemetryExporter } from '@sourcegraph/telemetry';
/**
 * MockServerTelemetryExporter exports events to a mock endpoint at
 * http://localhost:49300/.api/mockEventRecording
 */
export declare class MockServerTelemetryExporter implements TelemetryExporter {
    private anonymousUserID;
    constructor(anonymousUserID: string);
    exportEvents(events: TelemetryEventInput[]): Promise<void>;
    private postTestEventRecording;
}
//# sourceMappingURL=MockServerTelemetryExporter.d.ts.map