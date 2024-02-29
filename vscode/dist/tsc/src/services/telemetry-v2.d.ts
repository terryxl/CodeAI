import { type ConfigurationWithAccessToken, type TelemetryRecorder } from '@sourcegraph/cody-shared';
/**
 * Recorder for recording telemetry events in the new telemetry framework:
 * https://sourcegraph.com/docs/dev/background-information/telemetry
 *
 * See GraphQLTelemetryExporter to learn more about how events are exported
 * when recorded using the new recorder.
 *
 * The default recorder throws an error if it is used before initialization
 * via createOrUpdateTelemetryRecorderProvider.
 */
export declare let telemetryRecorder: TelemetryRecorder;
/**
 * Initializes or configures new event-recording globals, which leverage the
 * new telemetry framework:
 * https://sourcegraph.com/docs/dev/background-information/telemetry
 */
export declare function createOrUpdateTelemetryRecorderProvider(config: ConfigurationWithAccessToken, 
/**
 * Hardcode isExtensionModeDevOrTest to false to test real exports - when
 * true, exports are logged to extension output instead.
 */
isExtensionModeDevOrTest: boolean): Promise<void>;
/**
 * Nifty hack from https://stackoverflow.com/questions/54520676/in-typescript-how-to-get-the-keys-of-an-object-type-whose-values-are-of-a-given
 * that collects the keys of an object where the corresponding value is of a
 * given type as a type.
 */
type KeysWithNumericValues<T> = keyof {
    [P in keyof T as T[P] extends number ? P : never]: P;
};
/**
 * splitSafeMetadata is a helper for legacy telemetry helpers that accept typed
 * event metadata with arbitrarily-shaped values. It checks the types of the
 * parameters and automatically splits them into two objects:
 *
 * - metadata, with numeric values and boolean values converted into 1 or 0.
 * - privateMetadata, which includes everything else
 *
 * We export privateMetadata has special treatment in Sourcegraph.com, but do
 * not export it in private instances unless allowlisted. See
 * https://sourcegraph.com/docs/dev/background-information/telemetry#sensitive-attributes
 * for more details.
 *
 * This is only available as a migration helper - where possible, prefer to use
 * a telemetryRecorder directly instead, and build the parameters at the callsite.
 */
export declare function splitSafeMetadata<Properties extends {
    [key: string]: any;
}>(properties: Properties): {
    metadata: {
        [key in KeysWithNumericValues<Properties>]: number;
    };
    privateMetadata: {
        [key in keyof Properties]?: any;
    };
};
export {};
//# sourceMappingURL=telemetry-v2.d.ts.map