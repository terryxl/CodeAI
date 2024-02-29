import { TelemetryRecorderProvider as BaseTelemetryRecorderProvider, type TelemetryProcessor } from '@sourcegraph/telemetry';
import { type ConfigurationWithAccessToken } from '../configuration';
import type { LogEventMode } from '../sourcegraph-api/graphql/client';
import type { BillingCategory, BillingProduct } from '.';
interface ExtensionDetails {
    ide: 'VSCode' | 'JetBrains' | 'Neovim' | 'Emacs';
    ideExtensionType: 'Cody' | 'CodeSearch';
    /** Version number for the extension. */
    version: string;
}
/**
 * TelemetryRecorderProvider is the default provider implementation. It sends
 * events directly to a connected Sourcegraph instance.
 *
 * This is NOT meant for use if connecting to an Agent.
 */
export declare class TelemetryRecorderProvider extends BaseTelemetryRecorderProvider<BillingProduct, BillingCategory> {
    constructor(extensionDetails: ExtensionDetails, config: ConfigurationWithAccessToken, anonymousUserID: string, legacyBackcompatLogEventMode: LogEventMode);
}
/**
 * TelemetryRecorder is the type of recorders returned by
 * TelemetryRecorderProviders in this module. It's available as a type to work
 * around type reference issues like:
 *
 *   The inferred type of 'telemetryRecorder' cannot be named without a reference <...>
 */
export type TelemetryRecorder = typeof noOpTelemetryRecorder;
export declare class NoOpTelemetryRecorderProvider extends BaseTelemetryRecorderProvider<BillingProduct, BillingCategory> {
    constructor(processors?: TelemetryProcessor[]);
}
declare const noOpTelemetryRecorder: import("@sourcegraph/telemetry").TelemetryRecorder<"exampleBillingProduct", "exampleBillingCategory">;
/**
 * MockServerTelemetryRecorderProvider uses MockServerTelemetryExporter to export
 * events.
 */
export declare class MockServerTelemetryRecorderProvider extends BaseTelemetryRecorderProvider<BillingProduct, BillingCategory> {
    constructor(extensionDetails: ExtensionDetails, config: ConfigurationWithAccessToken, anonymousUserID: string);
}
export {};
//# sourceMappingURL=TelemetryRecorderProvider.d.ts.map