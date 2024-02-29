"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const test_1 = require("@playwright/test");
const common_1 = require("./common");
const helpers_1 = require("./helpers");
const versionUpdateStorageKey = 'notices.last-dismissed-version';
const greetingChatText = 'Welcome to Cody!';
const updateToastText = /Cody updated to v\d+\.\d+/;
(0, helpers_1.test)('new installs should not show the update toast', async ({ page, sidebar }) => {
    // Sign in and start a chat
    await (0, common_1.sidebarSignin)(page, sidebar);
    await page.getByRole('button', { name: 'New Chat', exact: true }).click();
    const chatFrame = page.frameLocator('iframe.webview').last().frameLocator('iframe');
    // The "updated" toast should not appear
    const introChat = chatFrame.getByText(greetingChatText);
    await (0, test_1.expect)(introChat).toBeVisible();
    const chatNotice = chatFrame.getByText(updateToastText);
    await (0, test_1.expect)(chatNotice).not.toBeVisible();
    // Local storage should reflect the extension version, for future update
    // notices
    (0, test_1.expect)(await chatFrame.locator(':root').evaluate((_, versionUpdateStorageKey) => {
        return localStorage.getItem(versionUpdateStorageKey);
    }, versionUpdateStorageKey)).toMatch(/\d+\.\d+/);
});
(0, helpers_1.test)('existing installs should show the update toast when the last dismissed version is different', async ({ page, sidebar, }) => {
    // Sign in
    await (0, common_1.sidebarSignin)(page, sidebar);
    // Use chat.
    await page.getByRole('button', { name: 'New Chat', exact: true }).click();
    let chatFrame = page.frameLocator('iframe.webview').last().frameLocator('iframe');
    const chatInput = chatFrame.getByRole('textbox', { name: 'Chat message' });
    await chatInput.fill('hey buddy');
    await chatInput.press('Enter');
    // Forge an older dismissed version into local storage.
    (0, test_1.expect)(await chatFrame.locator(':root').evaluate((_, versionUpdateStorageKey) => {
        localStorage.setItem(versionUpdateStorageKey, '0.7');
        return localStorage.getItem(versionUpdateStorageKey);
    }, versionUpdateStorageKey)).toBe('0.7');
    // Wait for this chat to be available in the sidebar
    const chatHistoryEntry = page.getByRole('treeitem', { name: 'hey buddy' });
    await (0, test_1.expect)(chatHistoryEntry).toBeVisible();
    await page.locator('*[aria-label="Tab actions"] *[aria-label~="Close"]').click();
    // Reopen the chat; the update notice should be visible.
    await chatHistoryEntry.click();
    chatFrame = page.frameLocator('iframe.webview').last().frameLocator('iframe');
    const introChat = chatFrame.getByText(greetingChatText);
    await (0, test_1.expect)(introChat).toBeVisible();
    const chatNotice = chatFrame.getByText(updateToastText);
    await (0, test_1.expect)(chatNotice).toBeVisible();
    // Dismiss the notice, expect local storage to have been updated
    await chatFrame.locator('.codicon.codicon-close').click();
    (0, test_1.expect)(await chatFrame.locator(':root').evaluate((_, versionUpdateStorageKey) => {
        return localStorage.getItem(versionUpdateStorageKey);
    }, versionUpdateStorageKey)).not.toBe('0.7');
});
