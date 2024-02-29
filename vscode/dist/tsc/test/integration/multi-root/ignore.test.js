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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const assert_1 = __importDefault(require("assert"));
const fs = __importStar(require("node:fs"));
const path = __importStar(require("node:path"));
const vscode = __importStar(require("vscode"));
const vscode_uri_1 = require("vscode-uri");
const helpers_1 = require("../helpers");
suite('Ignores in multi-root workspace', () => {
    const workspace1Path = vscode.workspace.workspaceFolders[0].uri.fsPath;
    const workspace2Path = vscode.workspace.workspaceFolders[1].uri.fsPath;
    async function checkIgnore(fullPath, expectIgnored) {
        const ignoreHelper = await (await (0, helpers_1.getExtensionAPI)().activate()).testing.ignoreHelper.get();
        await new Promise(resolve => setTimeout(resolve, 1000));
        fullPath = path.normalize(fullPath);
        const fileUri = vscode_uri_1.URI.file(fullPath);
        // Verify the file exists to ensure the parts are correct.
        assert_1.default.ok(fs.existsSync(fullPath));
        // Verify ignore status.
        assert_1.default.equal(ignoreHelper.isIgnored(fileUri), expectIgnored, `Wrong ignore status for ${fileUri}`);
    }
    test('ignores ws1 files in workspace1', () => checkIgnore(`${workspace1Path}/ignoreTests/ignoreTest.ws1`, true));
    test('does not ignore ws2 files in workspace1', () => checkIgnore(`${workspace1Path}/ignoreTests/ignoreTest.ws2`, false));
    test('does not ignore ws1 files in workspace2', () => checkIgnore(`${workspace2Path}/ignoreTests/ignoreTest.ws1`, false));
    test('ignores ws2 files in workspace2', () => checkIgnore(`${workspace2Path}/ignoreTests/ignoreTest.ws2`, true));
});
//# sourceMappingURL=ignore.test.js.map