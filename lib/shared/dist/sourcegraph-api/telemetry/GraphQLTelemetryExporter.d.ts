import type { TelemetryEventInput, TelemetryExporter } from '@sourcegraph/telemetry';
import type { LogEventMode, SourcegraphGraphQLAPIClient } from '../graphql/client';
/**
 * GraphQLTelemetryExporter exports events via the new Sourcegraph telemetry
 * framework: https://sourcegraph.com/docs/dev/background-information/telemetry
 *
 * If configured to do so, it will also attempt to send events to the old
 * event-logging mutations if the instance is older than 5.2.0.
 */
export declare class GraphQLTelemetryExporter implements TelemetryExporter {
    client: SourcegraphGraphQLAPIClient;
    /**
     * logEvent mode to use if exporter needs to use a legacy export mode.
     */
    private legacyBackcompatLogEventMode;
    private exportMode;
    private legacySiteIdentification;
    constructor(client: SourcegraphGraphQLAPIClient, anonymousUserID: string, 
    /**
     * logEvent mode to use if exporter needs to use a legacy export mode.
     */
    legacyBackcompatLogEventMode: LogEventMode);
    /**
     * Checks if the connected server supports the new GraphQL mutations
     * and sets the result to this.shouldUseLegacyEvents, and if we need to use
     * legacy events, we also set this.legacySiteIdentification to the site ID
     * of the connected instance - this is used to generate arguments for the
     * legacy event-recording API.
     */
    private setLegacyEventsStateOnce;
    /**
     * Implements export functionality by checking if the connected instance
     * supports the new events record first - if it does, we use the new
     * API, otherwise we translate the event into the old API and use that
     * instead.
     */
    exportEvents(events: TelemetryEventInput[]): Promise<void>;
}
type ExportMode = 'legacy' | '5.2.0-5.2.1' | '5.2.2-5.2.3' | '5.2.4' | '5.2.5+';
/**
 * handleExportModeTransforms mutates events in-place based on any workarounds
 * required for exportMode.
 */
export declare function handleExportModeTransforms(exportMode: ExportMode, events: TelemetryEventInput[]): void;
export {};
//# sourceMappingURL=GraphQLTelemetryExporter.d.ts.map