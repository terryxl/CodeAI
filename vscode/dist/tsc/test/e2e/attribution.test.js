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
const test_1 = require("@playwright/test");
const mockServer = __importStar(require("../fixtures/mock-server"));
const common_1 = require("./common");
const helpers_1 = require("./helpers");
const test = helpers_1.test
    .extend({ dotcomUrl: mockServer.SERVER_URL })
    .extend({
    // list of events we expect this test to log, add to this list as needed
    expectedEvents: [
        'CodyInstalled',
        'CodyVSCodeExtension:auth:clickOtherSignInOptions',
        'CodyVSCodeExtension:login:clicked',
        'CodyVSCodeExtension:auth:selectSigninMenu',
        'CodyVSCodeExtension:auth:fromToken',
        'CodyVSCodeExtension:Auth:connected',
        'CodyVSCodeExtension:chat-question:submitted',
        'CodyVSCodeExtension:chat-question:executed',
        'CodyVSCodeExtension:chatResponse:hasCode',
    ],
})
    .extend({
    extraWorkspaceSettings: {
        // TODO(#59720): Remove experimental setting.
        'cody.experimental.guardrails': true,
    },
});
test('attribution search enabled in chat', async ({ page, sidebar, expectedEvents }) => {
    await fetch(`${mockServer.SERVER_URL}/.test/attribution/enable`, { method: 'POST' });
    const [chatFrame, chatInput] = await prepareChat2(page, sidebar);
    await chatInput.fill('show me a code snippet');
    await chatInput.press('Enter');
    await (0, test_1.expect)(chatFrame.getByTestId('attribution-indicator')).toBeVisible();
});
test('attribution search disabled in chat', async ({ page, sidebar, expectedEvents }) => {
    await fetch(`${mockServer.SERVER_URL}/.test/attribution/disable`, { method: 'POST' });
    const [chatFrame, chatInput] = await prepareChat2(page, sidebar);
    await chatInput.fill('show me a code snippet');
    await chatInput.press('Enter');
    await (0, test_1.expect)(chatFrame.getByTestId('attribution-indicator')).toBeHidden();
});
async function prepareChat2(page, sidebar) {
    await (0, common_1.sidebarSignin)(page, sidebar);
    await page.getByRole('button', { name: 'New Chat', exact: true }).click();
    // Chat webview iframe is the second and last frame (search is the first)
    const chatFrame = page.frameLocator('iframe.webview').last().frameLocator('iframe');
    const chatInput = chatFrame.getByRole('textbox', { name: 'Chat message' });
    return [chatFrame, chatInput];
}
