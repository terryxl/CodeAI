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
const assert = __importStar(require("assert"));
const vscode = __importStar(require("vscode"));
const helpers_1 = require("../helpers");
async function getChatViewProvider() {
    const chatViewProvider = await (0, helpers_1.getExtensionAPI)().exports.testing?.chatPanelProvider.get();
    assert.ok(chatViewProvider);
    return chatViewProvider;
}
suite('Chat', function () {
    this.beforeEach(() => (0, helpers_1.beforeIntegrationTest)());
    this.afterEach(() => (0, helpers_1.afterIntegrationTest)());
    test('sends and receives a message', async () => {
        await vscode.commands.executeCommand('cody.chat.panel.new');
        const chatView = await getChatViewProvider();
        await chatView.handleUserMessageSubmission('test', 'hello from the human', 'user', [], false);
        assert.match((await (0, helpers_1.getTranscript)(0)).displayText || '', /^hello from the human$/);
        await (0, helpers_1.waitUntil)(async () => /^hello from the assistant$/.test((await (0, helpers_1.getTranscript)(1)).displayText || ''));
    });
    // do not display filename even when there is a selection in active editor
    test('append current file link to display text on editor selection', async () => {
        await (0, helpers_1.getTextEditorWithSelection)();
        await vscode.commands.executeCommand('cody.chat.panel.new');
        const chatView = await getChatViewProvider();
        await chatView.handleUserMessageSubmission('test', 'hello from the human', 'user', [], false);
        // Display text should include file link at the end of message
        assert.match((await (0, helpers_1.getTranscript)(0)).displayText || '', /^hello from the human$/);
        await (0, helpers_1.waitUntil)(async () => /^hello from the assistant$/.test((await (0, helpers_1.getTranscript)(1)).displayText || ''));
    });
});
//# sourceMappingURL=chat.test.js.map