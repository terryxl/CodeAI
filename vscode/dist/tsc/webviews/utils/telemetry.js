"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createWebviewTelemetryService = void 0;
/**
 * Create a new {@link TelemetryService} for use in the VS Code webviews.
 */
function createWebviewTelemetryService(vscodeAPI) {
    return {
        log: (eventName, properties) => {
            vscodeAPI.postMessage({ command: 'event', eventName, properties });
        },
    };
}
exports.createWebviewTelemetryService = createWebviewTelemetryService;
