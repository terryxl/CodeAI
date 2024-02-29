"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.splitSafeMetadata = exports.createOrUpdateTelemetryRecorderProvider = exports.telemetryRecorder = void 0;
const cody_shared_1 = require("@sourcegraph/cody-shared");
const telemetry_1 = require("@sourcegraph/telemetry");
const log_1 = require("../log");
const LocalStorageProvider_1 = require("./LocalStorageProvider");
const telemetry_2 = require("./telemetry");
let telemetryRecorderProvider;
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
exports.telemetryRecorder = new cody_shared_1.NoOpTelemetryRecorderProvider().getRecorder([
    new telemetry_1.CallbackTelemetryProcessor(() => {
        if (!process.env.VITEST) {
            throw new Error('telemetry-v2: recorder used before initialization');
        }
    }),
]);
/**
 * For legacy events export, where we are connected to a pre-5.2.0 instance,
 * the current strategy is to manually instrument a callsite the legacy logEvent
 * clients as well, and that will report events directly to dotcom. To avoid
 * duplicating the data, when we are doing a legacy export, we only send events
 * to the connected instance.
 *
 * In the future, when we remove the legacy event-logging clients, we should
 * change this back to 'all' so that legacy instances report events to
 * dotcom as well through the new clients.
 */
const legacyBackcompatLogEventMode = 'connected-instance-only';
const debugLogLabel = 'telemetry-v2';
function updateGlobalInstances(updatedProvider) {
    telemetryRecorderProvider?.unsubscribe();
    telemetryRecorderProvider = updatedProvider;
    exports.telemetryRecorder = updatedProvider.getRecorder([
        // Log all events in debug for reference.
        new telemetry_1.CallbackTelemetryProcessor(event => {
            (0, log_1.logDebug)(debugLogLabel, `recordEvent${updatedProvider.noOp ? ' (no-op)' : ''}: ${event.feature}/${event.action}: ${JSON.stringify({
                parameters: event.parameters,
                timestamp: event.timestamp,
            })}`);
        }),
    ]);
}
/**
 * Initializes or configures new event-recording globals, which leverage the
 * new telemetry framework:
 * https://sourcegraph.com/docs/dev/background-information/telemetry
 */
async function createOrUpdateTelemetryRecorderProvider(config, 
/**
 * Hardcode isExtensionModeDevOrTest to false to test real exports - when
 * true, exports are logged to extension output instead.
 */
isExtensionModeDevOrTest) {
    const extensionDetails = (0, telemetry_2.getExtensionDetails)(config);
    // Add timestamp processor for realistic data in output for dev or no-op scenarios
    const defaultNoOpProvider = new cody_shared_1.NoOpTelemetryRecorderProvider([new telemetry_1.TimestampTelemetryProcessor()]);
    if (config.telemetryLevel === 'off' ||
        !extensionDetails.ide ||
        extensionDetails.ideExtensionType !== 'Cody') {
        updateGlobalInstances(defaultNoOpProvider);
        return;
    }
    const { anonymousUserID, created: newAnonymousUser } = await LocalStorageProvider_1.localStorage.anonymousUserID();
    const initialize = telemetryRecorderProvider === undefined;
    /**
     * In testing, send events to the mock server.
     */
    if (process.env.CODY_TESTING === 'true') {
        (0, log_1.logDebug)(debugLogLabel, 'using mock exporter');
        updateGlobalInstances(new cody_shared_1.MockServerTelemetryRecorderProvider(extensionDetails, config, anonymousUserID));
    }
    else if (isExtensionModeDevOrTest) {
        (0, log_1.logDebug)(debugLogLabel, 'using no-op exports');
        updateGlobalInstances(defaultNoOpProvider);
    }
    else {
        updateGlobalInstances(new cody_shared_1.TelemetryRecorderProvider(extensionDetails, config, anonymousUserID, legacyBackcompatLogEventMode));
    }
    /**
     * On first initialization, also record some initial events.
     */
    if (initialize) {
        if (newAnonymousUser) {
            /**
             * New user
             */
            exports.telemetryRecorder.recordEvent('cody.extension', 'installed');
        }
        else if (!config.isRunningInsideAgent) {
            /**
             * Repeat user
             */
            exports.telemetryRecorder.recordEvent('cody.extension', 'savedLogin');
        }
    }
}
exports.createOrUpdateTelemetryRecorderProvider = createOrUpdateTelemetryRecorderProvider;
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
function splitSafeMetadata(properties) {
    const safe = {};
    const unsafe = {};
    for (const key in properties) {
        if (!Object.hasOwn(properties, key)) {
            continue;
        }
        const value = properties[key];
        switch (typeof value) {
            case 'number':
                safe[key] = value;
                break;
            case 'boolean':
                safe[key] = value ? 1 : 0;
                break;
            case 'object': {
                const { metadata } = splitSafeMetadata(value);
                for (const [nestedKey, value] of Object.entries(metadata)) {
                    // We know splitSafeMetadata returns only an object with
                    // numbers as values. Unit tests ensures this property holds.
                    safe[`${key}.${nestedKey}`] = value;
                }
                // Preserve the entire original value in unsafe
                unsafe[key] = value;
                break;
            }
            // By default, treat as potentially unsafe.
            default:
                unsafe[key] = value;
        }
    }
    return {
        // We know we've constructed an object with only numeric values, so
        // we cast it into the desired type where all the keys with number values
        // are present. Unit tests ensures this property holds.
        metadata: safe,
        privateMetadata: unsafe,
    };
}
exports.splitSafeMetadata = splitSafeMetadata;
