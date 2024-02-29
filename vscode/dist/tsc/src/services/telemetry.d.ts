import { type Configuration, type ConfigurationWithAccessToken, type ExtensionDetails, type TelemetryService } from '@sourcegraph/cody-shared';
export declare const getExtensionDetails: (config: Pick<Configuration, 'agentIDE'>) => ExtensionDetails;
/**
 * Initializes or configures legacy event-logging globals.
 */
export declare function createOrUpdateEventLogger(config: ConfigurationWithAccessToken, isExtensionModeDevOrTest: boolean): Promise<void>;
/**
 * telemetryService logs events using the legacy event-logging mutations.
 * @deprecated New callsites should use telemetryRecorder instead. Existing
 * callsites should ALSO record an event using services/telemetry-v2
 * as well and indicate this has happened, for example:
 *
 * logEvent(name, properties, { hasV2Event: true })
 * telemetryRecorder.recordEvent(...)
 *
 * In the future, all usages of TelemetryService will be removed in
 * favour of the new libraries. For more information, see:
 * https://sourcegraph.com/docs/dev/background-information/telemetry
 */
export declare const telemetryService: TelemetryService;
export declare function logPrefix(ide: 'VSCode' | 'JetBrains' | 'Neovim' | 'Emacs' | undefined): string;
//# sourceMappingURL=telemetry.d.ts.map