"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logPrefix = exports.telemetryService = exports.createOrUpdateEventLogger = exports.getExtensionDetails = void 0;
const vscode = __importStar(require("vscode"));
const cody_shared_1 = require("@sourcegraph/cody-shared");
const configuration_1 = require("../configuration");
const log_1 = require("../log");
const os_1 = require("../os");
const version_1 = require("../version");
const LocalStorageProvider_1 = require("./LocalStorageProvider");
let eventLogger = null;
let telemetryLevel = 'off';
let globalAnonymousUserID;
const { platform, arch } = (0, os_1.getOSArch)();
const getExtensionDetails = (config) => ({
    ide: config.agentIDE ?? 'VSCode',
    ideExtensionType: 'Cody',
    platform: platform ?? 'browser',
    arch,
    version: version_1.version,
});
exports.getExtensionDetails = getExtensionDetails;
/**
 * Initializes or configures legacy event-logging globals.
 */
async function createOrUpdateEventLogger(config, isExtensionModeDevOrTest) {
    if (config.telemetryLevel === 'off' || isExtensionModeDevOrTest) {
        // check that CODY_TESTING is not true, because we want to log events when we are testing
        if (process.env.CODY_TESTING !== 'true') {
            eventLogger = null;
            telemetryLevel = 'off';
            return;
        }
    }
    const extensionDetails = (0, exports.getExtensionDetails)(config);
    telemetryLevel = config.telemetryLevel;
    const { anonymousUserID, created } = await LocalStorageProvider_1.localStorage.anonymousUserID();
    globalAnonymousUserID = anonymousUserID;
    const serverEndpoint = LocalStorageProvider_1.localStorage?.getEndpoint() || config.serverEndpoint;
    if (!eventLogger) {
        eventLogger = new cody_shared_1.EventLogger(serverEndpoint, extensionDetails, config);
        if (created) {
            logEvent('CodyInstalled', undefined, {
                hasV2Event: true, // Created in src/services/telemetry-v2.ts
            });
        }
        else if (!config.isRunningInsideAgent) {
            logEvent('CodyVSCodeExtension:CodySavedLogin:executed', undefined, {
                hasV2Event: true, // Created in src/services/telemetry-v2.ts
            });
        }
        return;
    }
    eventLogger?.onConfigurationChange(serverEndpoint, extensionDetails, config);
}
exports.createOrUpdateEventLogger = createOrUpdateEventLogger;
/**
 * Log a telemetry event using the legacy event-logging mutations.
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
 * @param eventName The name of the event.
 * @param properties Event properties. Do NOT include any private information, such as full URLs
 * that may contain private repository names or search queries.
 *
 * PRIVACY: Do NOT include any potentially private information in `properties`. These properties may
 * get sent to analytics tools, so must not include private information, such as search queries or
 * repository names.
 */
function logEvent(eventName, properties, opts) {
    if (telemetryLevel === 'agent' && !opts?.agent) {
        return;
    }
    (0, log_1.logDebug)(`logEvent${eventLogger === null || process.env.CODY_TESTING === 'true' ? ' (telemetry disabled)' : ''}`, eventName, (0, exports.getExtensionDetails)((0, configuration_1.getConfiguration)(vscode.workspace.getConfiguration())).ide, JSON.stringify({ properties, opts }));
    if (!eventLogger || !globalAnonymousUserID) {
        return;
    }
    try {
        eventLogger.log(eventName, globalAnonymousUserID, properties, opts);
    }
    catch (error) {
        console.error(error);
    }
}
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
exports.telemetryService = {
    log(eventName, properties, opts) {
        logEvent(eventName, properties, opts);
    },
};
// TODO: Clean up this name mismatch when we move to TelemetryV2
function logPrefix(ide) {
    return ide
        ? {
            VSCode: 'CodyVSCodeExtension',
            JetBrains: 'CodyJetBrainsPlugin',
            Emacs: 'CodyEmacsPlugin',
            Neovim: 'CodyNeovimPlugin',
        }[ide]
        : 'CodyVSCodeExtension';
}
exports.logPrefix = logPrefix;
