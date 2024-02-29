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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.shouldErrorBeReported = exports.SentryService = void 0;
const cody_shared_1 = require("@sourcegraph/cody-shared");
const version_1 = require("../../version");
__exportStar(require("@sentry/core"), exports);
const SENTRY_DSN = 'https://f565373301c9c7ef18448a1c60dfde8d@o19358.ingest.sentry.io/4505743319564288';
class SentryService {
    config;
    constructor(config) {
        this.config = config;
        this.prepareReconfigure();
    }
    onConfigurationChange(newConfig) {
        this.config = newConfig;
        this.prepareReconfigure();
    }
    prepareReconfigure() {
        try {
            const isProd = process.env.NODE_ENV === 'production';
            // Used to enable Sentry reporting in the development environment.
            const isSentryEnabled = process.env.ENABLE_SENTRY === 'true';
            if (!isProd && !isSentryEnabled) {
                return;
            }
            const options = {
                dsn: SENTRY_DSN,
                release: version_1.version,
                environment: this.config.isRunningInsideAgent
                    ? 'agent'
                    : typeof process === 'undefined'
                        ? 'vscode-web'
                        : 'vscode-node',
                // In dev mode, have Sentry log extended debug information to the console.
                debug: !isProd,
                // Only send errors when connected to dotcom in the production build.
                beforeSend: (event, hint) => {
                    if (isProd &&
                        (0, cody_shared_1.isDotCom)(this.config.serverEndpoint) &&
                        shouldErrorBeReported(hint.originalException)) {
                        return event;
                    }
                    return null;
                },
            };
            this.reconfigure(options);
        }
        catch (error) {
            // We don't want to crash the extension host or VS Code if Sentry fails to load.
            console.error('Failed to initialize Sentry', error);
        }
    }
}
exports.SentryService = SentryService;
function shouldErrorBeReported(error) {
    if (error instanceof cody_shared_1.NetworkError) {
        // Ignore Server error responses (5xx).
        return error.status < 500;
    }
    if ((0, cody_shared_1.isAbortError)(error) || (0, cody_shared_1.isRateLimitError)(error) || (0, cody_shared_1.isAuthError)(error)) {
        return false;
    }
    return true;
}
exports.shouldErrorBeReported = shouldErrorBeReported;
