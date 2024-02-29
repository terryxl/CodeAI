"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const test_1 = require("@playwright/test");
const common_1 = require("./common");
const helpers_1 = require("./helpers");
helpers_1.test.extend({
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
        'CodyVSCodeExtension:chat-question:submitted',
        'CodyVSCodeExtension:chat-question:executed',
        'CodyVSCodeExtension:Auth:connected',
    ],
})('shows chat history in sidebar and update chat panel correctly', async ({ page, sidebar }) => {
    // Sign into Cody
    await (0, common_1.sidebarSignin)(page, sidebar);
    const heyTreeItem = page.getByRole('treeitem', { name: 'Hey' });
    const holaTreeItem = page.getByRole('treeitem', { name: 'Hola' });
    await page.getByRole('button', { name: 'New Chat', exact: true }).click();
    const chatPanelFrame = page.frameLocator('iframe.webview').last().frameLocator('iframe');
    const chatInput = chatPanelFrame.getByRole('textbox', { name: 'Chat message' });
    await chatInput.fill('Hey');
    await chatInput.press('Enter');
    // Check if chat shows up in sidebar chat history tree view
    await (0, test_1.expect)(heyTreeItem).toBeVisible();
    // Clear and restart chat session
    // All current messages should be removed, and the panel name should be updated to 'New Chat'
    await chatInput.fill('/reset');
    await chatInput.press('Enter');
    await (0, test_1.expect)(chatPanelFrame.getByText('Hey')).not.toBeVisible();
    await (0, test_1.expect)(page.getByRole('tab', { name: 'New Chat' })).toBeVisible();
    // Submit a new message and check if both sessions are showing up in the sidebar
    await chatInput.fill('Hola');
    await chatInput.press('Enter');
    await (0, test_1.expect)(holaTreeItem).toBeVisible();
    await (0, test_1.expect)(heyTreeItem).toBeVisible();
    // The panel name is now updated to the last submitted message
    await (0, test_1.expect)(page.getByRole('tab', { name: 'Hola' })).toBeVisible();
    // Click on the previous chat session to open the chat panel in editor
    // Both chat panels should be visible as tabs in the editor
    await page
        .getByRole('treeitem', { name: 'Hey' })
        .locator('div')
        .filter({ hasText: 'Hey' })
        .nth(3)
        .click();
    await (0, test_1.expect)(page.getByRole('tab', { name: 'Hey' })).toBeVisible();
    // NOTE: Action buttons may only appear when we're hovering a chat.
    // Deleting a chat should also close its associated chat panel
    await heyTreeItem.hover();
    await heyTreeItem.getByLabel('Delete Chat').hover();
    await heyTreeItem.getByLabel('Delete Chat').click();
    (0, test_1.expect)(heyTreeItem).not.toBeVisible();
    await (0, test_1.expect)(page.getByRole('tab', { name: 'Hey' })).not.toBeVisible();
    await holaTreeItem.hover();
    await holaTreeItem.getByLabel('Delete Chat').hover();
    await holaTreeItem.getByLabel('Delete Chat').click();
    (0, test_1.expect)(holaTreeItem).not.toBeVisible();
    await (0, test_1.expect)(page.getByRole('tab', { name: 'Hola' })).not.toBeVisible();
    // Once the chat history is empty, the 'New Chat' button should show up
    await page.waitForSelector('div[class*="welcome-view-content"]');
    await page.locator('.welcome-view-content').hover();
    await page.getByRole('button', { name: 'New Chat', exact: true }).hover();
    await (0, test_1.expect)(page.getByRole('button', { name: 'New Chat', exact: true })).toBeVisible();
});
