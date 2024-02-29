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
const mockServer = __importStar(require("../fixtures/mock-server"));
const common_1 = require("./common");
const helpers_1 = require("./helpers");
const test = helpers_1.test.extend({ dotcomUrl: mockServer.SERVER_URL });
const ERROR_DECORATION_SELECTOR = 'div.view-overlays[role="presentation"] div[class*="squiggly-error"]';
test.extend({
    // list of events we expect this test to log, add to this list as needed
    expectedEvents: [
        'CodyVSCodeExtension:chat-question:submitted',
        'CodyVSCodeExtension:chat-question:executed',
    ],
})('code action: explain', async ({ page, sidebar }) => {
    // Sign into Cody
    await (0, common_1.sidebarSignin)(page, sidebar);
    // Open the Explorer view from the sidebar
    await (0, common_1.sidebarExplorer)(page).click();
    // Open the error.ts file from the tree view
    await page.getByRole('treeitem', { name: 'error.ts' }).locator('a').click();
    // Wait for error.ts to fully open
    await page.getByRole('tab', { name: 'error.ts' }).hover();
    // Remove the comment that suppresses the type error
    await page.getByText('// @ts-nocheck').click({ clickCount: 3 });
    await page.keyboard.press('Backspace');
    // Activate the code action on the erred text
    const erredText = page.getByText('logNumber').nth(1);
    await page.waitForSelector(ERROR_DECORATION_SELECTOR);
    await erredText.click();
    await erredText.hover();
    await page.getByRole('button', { name: /Quick Fix/ }).click();
    // Get by text takes a very long time, it's faster to type and let the quick fix item be focused
    await page.keyboard.type('Explain');
    await page.keyboard.press('Enter');
});
test.extend({
    // list of events we expect this test to log, add to this list as needed
    expectedEvents: [
        'CodyVSCodeExtension:command:edit:executed',
        'CodyVSCodeExtension:fixupResponse:hasCode',
        'CodyVSCodeExtension:fixup:applied',
    ],
})('code action: fix', async ({ page, sidebar }) => {
    // Sign into Cody
    await (0, common_1.sidebarSignin)(page, sidebar);
    // Open the Explorer view from the sidebar
    await (0, common_1.sidebarExplorer)(page).click();
    // Open the error.ts file from the tree view
    await page.getByRole('treeitem', { name: 'error.ts' }).locator('a').click();
    // Wait for error.ts to fully open
    await page.getByRole('tab', { name: 'error.ts' }).hover();
    // Remove the comment that suppresses the type error
    await page.getByText('// @ts-nocheck').click({ clickCount: 3 });
    await page.keyboard.press('Backspace');
    // Activate the code action on the erred text
    const erredText = page.getByText('logNumber').nth(1);
    await page.waitForSelector(ERROR_DECORATION_SELECTOR);
    await erredText.click();
    await erredText.hover();
    await page.getByRole('button', { name: /Quick Fix/ }).click();
    // Get by text takes a very long time, it's faster to type and let the quick fix item be focused
    await page.keyboard.type('Fix');
    await page.keyboard.press('Enter');
});
