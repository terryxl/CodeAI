import type { ConfigurationWithAccessToken } from '../configuration';
import type { TelemetryEventProperties } from '.';
export interface ExtensionDetails {
    ide: 'VSCode' | 'JetBrains' | 'Neovim' | 'Emacs';
    ideExtensionType: 'Cody' | 'CodeSearch';
    platform: string;
    arch?: string;
    /** Version number for the extension. */
    version: string;
}
export declare class EventLogger {
    private serverEndpoint;
    private extensionDetails;
    private config;
    private gqlAPIClient;
    private client;
    private siteIdentification?;
    constructor(serverEndpoint: string, extensionDetails: ExtensionDetails, config: ConfigurationWithAccessToken);
    onConfigurationChange(newServerEndpoint: string, newExtensionDetails: ExtensionDetails, newConfig: ConfigurationWithAccessToken): void;
    private setSiteIdentification;
    /**
     * Log a telemetry event using the legacy event-logging mutations.
     *
     * DEPRECATED: Callsites should ALSO record an event using services/telemetryV2
     * as well and indicate this has happened, for example:
     *
     * logEvent(name, properties, { hasV2Event: true })
     * telemetryRecorder.recordEvent(...)
     *
     * In the future, all usages of TelemetryService will be removed in
     * favour of the new libraries. For more information, see:
     * https://sourcegraph.com/docs/dev/background-information/telemetry
     *
     * PRIVACY: Do NOT include any potentially private information in `eventProperties`. These
     * properties may get sent to analytics tools, so must not include private information, such as
     * search queries or repository names.
     * @param eventName The name of the event.
     * @param anonymousUserID The randomly generated unique user ID.
     * @param properties Event properties. Do NOT include any private information, such as full
     * URLs that may contain private repository names or search queries.
     */
    log(eventName: string, anonymousUserID: string, properties?: TelemetryEventProperties, opts?: {
        hasV2Event?: boolean;
    }): void;
}
//# sourceMappingURL=EventLogger.d.ts.map