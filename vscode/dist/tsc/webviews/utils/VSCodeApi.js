"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getVSCodeAPI = void 0;
const vscode_uri_1 = require("vscode-uri");
const cody_shared_1 = require("@sourcegraph/cody-shared");
let api;
function getVSCodeAPI() {
    if (!api) {
        const vsCodeApi = acquireVsCodeApi();
        api = {
            postMessage: message => vsCodeApi.postMessage(message),
            onMessage: callback => {
                const listener = (event) => {
                    callback((0, cody_shared_1.hydrateAfterPostMessage)(event.data, uri => vscode_uri_1.URI.from(uri)));
                };
                window.addEventListener('message', listener);
                return () => window.removeEventListener('message', listener);
            },
            setState: newState => vsCodeApi.setState(newState),
            getState: () => vsCodeApi.getState(),
        };
    }
    return api;
}
exports.getVSCodeAPI = getVSCodeAPI;
