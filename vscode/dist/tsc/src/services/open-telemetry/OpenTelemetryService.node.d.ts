import { type ConfigurationWithAccessToken } from '@sourcegraph/cody-shared';
type OpenTelemetryServiceConfig = Pick<ConfigurationWithAccessToken, 'serverEndpoint' | 'experimentalTracing'>;
export declare class OpenTelemetryService {
    protected config: OpenTelemetryServiceConfig;
    private sdk;
    private lastTraceUrl;
    private reconfigurePromiseMutex;
    constructor(config: OpenTelemetryServiceConfig);
    onConfigurationChange(newConfig: OpenTelemetryServiceConfig): void;
    private reconfigure;
}
export {};
//# sourceMappingURL=OpenTelemetryService.node.d.ts.map