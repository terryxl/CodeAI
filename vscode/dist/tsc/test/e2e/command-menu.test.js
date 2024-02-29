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
const common_1 = require("./common");
const helpers_1 = require("./helpers");
const mockServer = __importStar(require("../fixtures/mock-server"));
const test = helpers_1.test.extend({ dotcomUrl: mockServer.SERVER_URL });
test('Start a new chat from Cody Command Menu', async ({ page, sidebar }) => {
    // Sign into Cody
    await (0, common_1.sidebarSignin)(page, sidebar);
    // Open the File Explorer view from the sidebar
    await (0, common_1.sidebarExplorer)(page).click();
    // Open the index.html file from the tree view
    await page.getByRole('treeitem', { name: 'index.html' }).locator('a').dblclick();
    // Wait for index.html to fully open
    await page.getByRole('tab', { name: 'index.html' }).hover();
    await page.getByText('<title>Hello Cody</title>').hover();
    await page.getByRole('tab', { name: 'index.html' }).click();
    // Submit a chat question via command menu using "New Chat" option in Command Menu
    await page.getByRole('button', { name: /Commands \(.*/ }).dblclick();
    const commandInputBox = page.getByPlaceholder(/Search for a command or enter/);
    await (0, test_1.expect)(commandInputBox).toBeVisible();
    await commandInputBox.fill('new chat submitted from command menu');
    // this will fail if more than 1 New Chat item in the menu is found
    await page.getByLabel('comment  New Chat, Start a new chat', { exact: true }).hover();
    await (0, test_1.expect)(page.getByLabel('comment  New Chat, Start a new chat', { exact: true })).toBeVisible();
    await page.getByLabel('wand  Edit Code, Start a code edit', { exact: true }).hover();
    await (0, test_1.expect)(page.getByLabel('wand  Edit Code, Start a code edit', { exact: true })).toBeVisible();
    await page.getByLabel('Start a new chat').locator('a').click();
    // the question should show up in the chat panel on submit
    const chatPanel = page.frameLocator('iframe.webview').last().frameLocator('iframe');
    await chatPanel.getByText('new chat submitted from command menu').click();
    const expectedEvents = [
        'CodyVSCodeExtension:menu:command:default:clicked',
        'CodyVSCodeExtension:chat-question:submitted',
        'CodyVSCodeExtension:chat-question:executed',
    ];
    await (0, helpers_1.assertEvents)(mockServer.loggedEvents, expectedEvents);
});
