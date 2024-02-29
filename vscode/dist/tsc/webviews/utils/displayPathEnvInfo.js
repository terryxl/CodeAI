"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateDisplayPathEnvInfoForWebview = void 0;
const vscode_uri_1 = require("vscode-uri");
const cody_shared_1 = require("@sourcegraph/cody-shared");
/** Runs in the VS Code webview. */
function updateDisplayPathEnvInfoForWebview(workspaceFolderUris) {
    (0, cody_shared_1.setDisplayPathEnvInfo)({
        isWindows: (0, cody_shared_1.isWindows)(),
        workspaceFolders: workspaceFolderUris.map(uri => vscode_uri_1.URI.parse(uri)),
    });
}
exports.updateDisplayPathEnvInfoForWebview = updateDisplayPathEnvInfoForWebview;
