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
exports.manageDisplayPathEnvInfoForExtension = void 0;
const vscode = __importStar(require("vscode"));
const cody_shared_1 = require("@sourcegraph/cody-shared");
/** Runs in the VS Code extension host. */
function manageDisplayPathEnvInfoForExtension() {
    function update() {
        (0, cody_shared_1.setDisplayPathEnvInfo)({
            isWindows: (0, cody_shared_1.isWindows)(),
            workspaceFolders: vscode.workspace.workspaceFolders?.map(f => f.uri) ?? [],
        });
    }
    update();
    const disposable = vscode.workspace.onDidChangeWorkspaceFolders(() => {
        update();
    });
    return disposable;
}
exports.manageDisplayPathEnvInfoForExtension = manageDisplayPathEnvInfoForExtension;
