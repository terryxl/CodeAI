import { TelemetryRecorderProvider as BaseTelemetryRecorderProvider, defaultEventRecordingOptions, NoOpTelemetryExporter, TimestampTelemetryProcessor, TestTelemetryExporter, } from '@sourcegraph/telemetry';
import { CONTEXT_SELECTION_ID, } from '../configuration';
import { SourcegraphGraphQLAPIClient } from '../sourcegraph-api/graphql';
import { GraphQLTelemetryExporter } from '../sourcegraph-api/telemetry/GraphQLTelemetryExporter';
import { MockServerTelemetryExporter } from '../sourcegraph-api/telemetry/MockServerTelemetryExporter';
/**
 * TelemetryRecorderProvider is the default provider implementation. It sends
 * events directly to a connected Sourcegraph instance.
 *
 * This is NOT meant for use if connecting to an Agent.
 */
export class TelemetryRecorderProvider extends BaseTelemetryRecorderProvider {
    constructor(extensionDetails, config, anonymousUserID, legacyBackcompatLogEventMode) {
        const client = new SourcegraphGraphQLAPIClient(config);
        super({
            client: `${extensionDetails.ide || 'unknown'}${extensionDetails.ideExtensionType ? `.${extensionDetails.ideExtensionType}` : ''}`,
            clientVersion: extensionDetails.version,
        }, process.env.CODY_TELEMETRY_EXPORTER === 'testing'
            ? new TestTelemetryExporter()
            : new GraphQLTelemetryExporter(client, anonymousUserID, legacyBackcompatLogEventMode), [
            new ConfigurationMetadataProcessor(config),
            // Generate timestamps when recording events, instead of serverside
            new TimestampTelemetryProcessor(),
        ], {
            ...defaultEventRecordingOptions,
            bufferTimeMs: 0, // disable buffering for now
        });
    }
}
export class NoOpTelemetryRecorderProvider extends BaseTelemetryRecorderProvider {
    constructor(processors) {
        super({ client: '' }, new NoOpTelemetryExporter(), processors || []);
    }
}
const noOpTelemetryRecorder = new NoOpTelemetryRecorderProvider().getRecorder();
/**
 * MockServerTelemetryRecorderProvider uses MockServerTelemetryExporter to export
 * events.
 */
export class MockServerTelemetryRecorderProvider extends BaseTelemetryRecorderProvider {
    constructor(extensionDetails, config, anonymousUserID) {
        super({
            client: `${extensionDetails.ide}.${extensionDetails.ideExtensionType}`,
            clientVersion: extensionDetails.version,
        }, new MockServerTelemetryExporter(anonymousUserID), [new ConfigurationMetadataProcessor(config)]);
    }
}
/**
 * ConfigurationMetadataProcessor turns config into metadata that is
 * automatically attached to all events.
 */
class ConfigurationMetadataProcessor {
    config;
    constructor(config) {
        this.config = config;
    }
    processEvent(event) {
        if (!event.parameters.metadata) {
            event.parameters.metadata = [];
        }
        event.parameters.metadata.push({
            key: 'contextSelection',
            value: CONTEXT_SELECTION_ID[this.config.useContext],
        }, {
            key: 'guardrails',
            value: this.config.experimentalGuardrails ? 1 : 0,
        });
    }
}
//# sourceMappingURL=TelemetryRecorderProvider.js.map