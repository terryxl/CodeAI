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
exports.testFileUri = exports.getTestDocWithCursor = exports.getTextEditorWithSelection = exports.getTranscript = exports.getExtensionAPI = exports.waitUntil = exports.ensureExecuteCommand = exports.afterIntegrationTest = exports.beforeIntegrationTest = void 0;
const assert = __importStar(require("assert"));
const vscode = __importStar(require("vscode"));
const mockServer = __importStar(require("../fixtures/mock-server"));
/**
 * Setup (`beforeEach`) function for integration tests that need Cody configured and activated.
 */
async function beforeIntegrationTest() {
    // Wait for Cody extension to become ready.
    const api = vscode.extensions.getExtension('sourcegraph.cody-ai');
    assert.ok(api, 'extension not found');
    await api?.activate();
    // Wait for Cody to become activated.
    await new Promise(resolve => setTimeout(resolve, 200));
    // Configure extension.
    await ensureExecuteCommand('cody.test.token', mockServer.SERVER_URL, mockServer.VALID_TOKEN);
}
exports.beforeIntegrationTest = beforeIntegrationTest;
/**
 * Teardown (`afterEach`) function for integration tests that use {@link beforeIntegrationTest}.
 */
async function afterIntegrationTest() {
    await ensureExecuteCommand('cody.test.token', null);
}
exports.afterIntegrationTest = afterIntegrationTest;
// executeCommand specifies ...any[] https://code.visualstudio.com/api/references/vscode-api#commands
async function ensureExecuteCommand(command, ...args) {
    await waitUntil(async () => (await vscode.commands.getCommands(true)).includes(command));
    const result = await vscode.commands.executeCommand(command, ...args);
    return result;
}
exports.ensureExecuteCommand = ensureExecuteCommand;
async function waitUntil(predicate) {
    let delay = 10;
    while (!(await predicate())) {
        await new Promise(resolve => setTimeout(resolve, delay));
        delay <<= 1;
    }
}
exports.waitUntil = waitUntil;
function getExtensionAPI() {
    const api = vscode.extensions.getExtension('sourcegraph.cody-ai');
    assert.ok(api);
    return api;
}
exports.getExtensionAPI = getExtensionAPI;
// Waits for the index-th message to appear in the chat transcript, and returns it.
async function getTranscript(index) {
    const api = getExtensionAPI();
    const testSupport = api.exports.testing;
    assert.ok(testSupport);
    let transcript;
    await waitUntil(async () => {
        if (!api.isActive || !api.exports.testing) {
            return false;
        }
        transcript = await getExtensionAPI().exports.testing?.chatMessages();
        return transcript !== undefined && transcript.length > index && Boolean(transcript[index].text);
    });
    assert.ok(transcript);
    return transcript[index];
}
exports.getTranscript = getTranscript;
async function getTextEditorWithSelection() {
    // Open Main.java
    assert.ok(vscode.workspace.workspaceFolders);
    const mainJavaUri = vscode.Uri.parse(`${vscode.workspace.workspaceFolders[0].uri.toString()}/Main.java`);
    const textEditor = await vscode.window.showTextDocument(mainJavaUri);
    // Select the "main" method
    textEditor.selection = new vscode.Selection(5, 0, 7, 0);
}
exports.getTextEditorWithSelection = getTextEditorWithSelection;
async function getTestDocWithCursor() {
    // Open buzz.ts
    assert.ok(vscode.workspace.workspaceFolders);
    const uri = vscode.Uri.parse(`${vscode.workspace.workspaceFolders[0].uri.toString()}/buzz.ts`);
    const textEditor = await vscode.window.showTextDocument(uri);
    // Move cursor inside the function
    textEditor.selection = new vscode.Selection(5, 0, 5, 0);
}
exports.getTestDocWithCursor = getTestDocWithCursor;
/**
 * For testing only. Return a platform-native absolute path for a filename. Tests should almost
 * always use this instead of {@link URI.file}. Only use {@link URI.file} directly if the test is
 * platform-specific.
 *
 * For macOS/Linux, it returns `/file`. For Windows, it returns `C:\file`.
 * @param relativePath The name/relative path of the file (with forward slashes).
 *
 * NOTE: Copied from @sourcegraph/cody-shared because the test module can't require it (because it's
 * ESM).
 */
function testFileUri(relativePath) {
    return vscode.Uri.file(isWindows() ? `C:\\${relativePath.replaceAll('/', '\\')}` : `/${relativePath}`);
}
exports.testFileUri = testFileUri;
/**
 * Report whether the current OS is Windows.
 *
 * NOTE: Copied from @sourcegraph/cody-shared because the test module can't require it (because it's
 * ESM).
 */
function isWindows() {
    // For Node environments (such as VS Code Desktop).
    if (typeof process !== 'undefined') {
        if (process.platform) {
            return process.platform.startsWith('win');
        }
    }
    // For web environments (such as webviews and VS Code Web).
    if (typeof navigator === 'object') {
        return navigator.userAgent.toLowerCase().includes('windows');
    }
    return false; // default
}
//# sourceMappingURL=helpers.js.map