import { diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http'
import { Resource } from '@opentelemetry/resources'
import { NodeSDK } from '@opentelemetry/sdk-node'
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions'

import {
    FeatureFlag,
    featureFlagProvider,
    type ConfigurationWithAccessToken,
} from '@sourcegraph/cody-shared'

import { version } from '../../version'
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base'
import { ConsoleBatchSpanExporter } from './console-batch-span-exporter'

type OpenTelemetryServiceConfig = Pick<
    ConfigurationWithAccessToken,
    'serverEndpoint' | 'experimentalTracing'
>

export class OpenTelemetryService {
    private sdk: NodeSDK | undefined
    private lastTraceUrl: string | undefined
    // We use a single promise object that we chain on to, to avoid multiple reconfigure calls to
    // be run in parallel
    private reconfigurePromiseMutex: Promise<void> = Promise.resolve()

    constructor(protected config: OpenTelemetryServiceConfig) {
        this.reconfigurePromiseMutex = this.reconfigurePromiseMutex.then(() => this.reconfigure())
    }

    public onConfigurationChange(newConfig: OpenTelemetryServiceConfig): void {
        this.config = newConfig
        this.reconfigurePromiseMutex = this.reconfigurePromiseMutex.then(() => this.reconfigure())
    }

    private async reconfigure(): Promise<void> {
        const isEnabled =
            this.config.experimentalTracing ||
            (await featureFlagProvider.evaluateFeatureFlag(FeatureFlag.CodyAutocompleteTracing))

        if (!isEnabled) {
            return
        }

        const traceUrl = new URL('/-/debug/otlp/v1/traces', this.config.serverEndpoint).toString()
        if (this.lastTraceUrl === traceUrl) {
            return
        }
        this.lastTraceUrl = traceUrl
        diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.ERROR)

        await this.sdk?.shutdown()
        this.sdk = undefined

        this.sdk = new NodeSDK({
            resource: new Resource({
                [SemanticResourceAttributes.SERVICE_NAME]: 'cody-client',
                [SemanticResourceAttributes.SERVICE_VERSION]: version,
            }),
            instrumentations: [new HttpInstrumentation()],
            traceExporter: new OTLPTraceExporter({ url: traceUrl }),

            // Disable default process logging. We do not care about the VS Code extension process
            autoDetectResources: false,

            ...(process.env.NODE_ENV === 'development' && {
                spanProcessor: new BatchSpanProcessor(new ConsoleBatchSpanExporter()),
            }),
        })
        this.sdk.start()
    }
}
