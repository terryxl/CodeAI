"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenTelemetryService = void 0;
const api_1 = require("@opentelemetry/api");
const exporter_trace_otlp_http_1 = require("@opentelemetry/exporter-trace-otlp-http");
const instrumentation_http_1 = require("@opentelemetry/instrumentation-http");
const resources_1 = require("@opentelemetry/resources");
const sdk_node_1 = require("@opentelemetry/sdk-node");
const semantic_conventions_1 = require("@opentelemetry/semantic-conventions");
const cody_shared_1 = require("@sourcegraph/cody-shared");
const version_1 = require("../../version");
const sdk_trace_base_1 = require("@opentelemetry/sdk-trace-base");
const console_batch_span_exporter_1 = require("./console-batch-span-exporter");
class OpenTelemetryService {
    config;
    sdk;
    lastTraceUrl;
    // We use a single promise object that we chain on to, to avoid multiple reconfigure calls to
    // be run in parallel
    reconfigurePromiseMutex = Promise.resolve();
    constructor(config) {
        this.config = config;
        this.reconfigurePromiseMutex = this.reconfigurePromiseMutex.then(() => this.reconfigure());
    }
    onConfigurationChange(newConfig) {
        this.config = newConfig;
        this.reconfigurePromiseMutex = this.reconfigurePromiseMutex.then(() => this.reconfigure());
    }
    async reconfigure() {
        const isEnabled = this.config.experimentalTracing ||
            (await cody_shared_1.featureFlagProvider.evaluateFeatureFlag(cody_shared_1.FeatureFlag.CodyAutocompleteTracing));
        if (!isEnabled) {
            return;
        }
        const traceUrl = new URL('/-/debug/otlp/v1/traces', this.config.serverEndpoint).toString();
        if (this.lastTraceUrl === traceUrl) {
            return;
        }
        this.lastTraceUrl = traceUrl;
        api_1.diag.setLogger(new api_1.DiagConsoleLogger(), api_1.DiagLogLevel.ERROR);
        await this.sdk?.shutdown();
        this.sdk = undefined;
        this.sdk = new sdk_node_1.NodeSDK({
            resource: new resources_1.Resource({
                [semantic_conventions_1.SemanticResourceAttributes.SERVICE_NAME]: 'cody-client',
                [semantic_conventions_1.SemanticResourceAttributes.SERVICE_VERSION]: version_1.version,
            }),
            instrumentations: [new instrumentation_http_1.HttpInstrumentation()],
            traceExporter: new exporter_trace_otlp_http_1.OTLPTraceExporter({ url: traceUrl }),
            // Disable default process logging. We do not care about the VS Code extension process
            autoDetectResources: false,
            ...(process.env.NODE_ENV === 'development' && {
                spanProcessor: new sdk_trace_base_1.BatchSpanProcessor(new console_batch_span_exporter_1.ConsoleBatchSpanExporter()),
            }),
        });
        this.sdk.start();
    }
}
exports.OpenTelemetryService = OpenTelemetryService;
