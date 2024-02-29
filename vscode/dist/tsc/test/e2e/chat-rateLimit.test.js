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
exports.prepareChat = void 0;
const test_1 = require("@playwright/test");
const mockServer = __importStar(require("../fixtures/mock-server"));
const common_1 = require("./common");
const helpers_1 = require("./helpers");
const test = helpers_1.test.extend({ dotcomUrl: mockServer.SERVER_URL });
test.extend({
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
        'CodyVSCodeExtension:upsellUsageLimitCTA:shown',
    ],
})('shows upgrade rate limit message for free users', async ({ page, sidebar }) => {
    await fetch(`${mockServer.SERVER_URL}/.test/completions/triggerRateLimit/free`, {
        method: 'POST',
    });
    const [chatFrame, chatInput] = await prepareChat(page, sidebar);
    await chatInput.fill('test message');
    await chatInput.press('Enter');
    await (0, test_1.expect)(chatFrame.getByRole('heading', { name: 'Upgrade to Cody Pro' })).toBeVisible();
    await (0, test_1.expect)(chatFrame.getByRole('button', { name: 'Upgrade' })).toBeVisible();
});
test.extend({
    expectedEvents: [
        'CodyInstalled',
        'CodyVSCodeExtension:auth:clickOtherSignInOptions',
        'CodyVSCodeExtension:login:clicked',
        'CodyVSCodeExtension:auth:selectSigninMenu',
        'CodyVSCodeExtension:auth:fromToken',
        'CodyVSCodeExtension:Auth:connected',
        'CodyVSCodeExtension:chat-question:submitted',
        'CodyVSCodeExtension:chat-question:executed',
        'CodyVSCodeExtension:abuseUsageLimitCTA:shown',
    ],
})('shows standard rate limit message for pro users', async ({ page, sidebar }) => {
    await fetch(`${mockServer.SERVER_URL}/.test/completions/triggerRateLimit/pro`, {
        method: 'POST',
    });
    const [chatFrame, chatInput] = await prepareChat(page, sidebar);
    await chatInput.fill('test message');
    await chatInput.press('Enter');
    await (0, test_1.expect)(chatFrame.getByRole('heading', { name: 'Unable to Send Message' })).toBeVisible();
    await (0, test_1.expect)(chatFrame.getByRole('button', { name: 'Learn More' })).toBeVisible();
});
test.extend({
    expectedEvents: [
        'CodyInstalled',
        'CodyVSCodeExtension:auth:clickOtherSignInOptions',
        'CodyVSCodeExtension:login:clicked',
        'CodyVSCodeExtension:auth:selectSigninMenu',
        'CodyVSCodeExtension:auth:fromToken',
        'CodyVSCodeExtension:Auth:connected',
        'CodyVSCodeExtension:chat-question:submitted',
        'CodyVSCodeExtension:chat-question:executed',
        'CodyVSCodeExtension:abuseUsageLimitCTA:shown',
    ],
})('shows standard rate limit message for non-dotCom users', async ({ page, sidebar }) => {
    await fetch(`${mockServer.SERVER_URL}/.test/completions/triggerRateLimit`, {
        method: 'POST',
    });
    const [chatFrame, chatInput] = await prepareChat(page, sidebar);
    await chatInput.fill('test message');
    await chatInput.press('Enter');
    await (0, test_1.expect)(chatFrame.getByRole('heading', { name: 'Unable to Send Message' })).toBeVisible();
    await (0, test_1.expect)(chatFrame.getByRole('button', { name: 'Learn More' })).toBeVisible();
});
async function prepareChat(page, sidebar) {
    await (0, common_1.sidebarSignin)(page, sidebar);
    await page.getByRole('button', { name: 'New Chat', exact: true }).click();
    // Chat webview iframe is the second and last frame (search is the first)
    const chatFrame = page.frameLocator('iframe.webview').last().frameLocator('iframe');
    const chatInput = chatFrame.getByRole('textbox', { name: 'Chat message' });
    return [chatFrame, chatInput];
}
exports.prepareChat = prepareChat;
