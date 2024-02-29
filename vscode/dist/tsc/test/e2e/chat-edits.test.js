"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const test_1 = require("@playwright/test");
const common_1 = require("./common");
const helpers_1 = require("./helpers");
const platform_1 = require("@sourcegraph/cody-shared/src/common/platform");
const osKey = (0, platform_1.isMac)() ? 'Meta' : 'Control';
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
    ],
})('editing follow-up messages in chat view', async ({ page, sidebar }) => {
    await (0, common_1.sidebarSignin)(page, sidebar);
    await page.getByRole('button', { name: 'New Chat', exact: true }).click();
    const chatFrame = page.frameLocator('iframe.webview').last().frameLocator('iframe');
    const chatInput = chatFrame.getByRole('textbox', { name: 'Chat message' });
    // Chat Action Buttons - above the input box
    const editLastMessageButton = chatFrame.getByRole('button', { name: /^Edit Last Message / });
    const newChatButton = chatFrame.getByRole('button', { name: /^Start New Chat / });
    const cancelEditButton = chatFrame.getByRole('button', { name: /^Cancel Edit / });
    // Chat Submit Buttons - on the left of the input box
    const updateMessageButton = chatFrame.getByTitle('Update Message');
    const submitMessageButton = chatFrame.getByTitle('Send Message');
    const startNewChatButton = chatFrame.getByTitle('Start New Chat');
    // Submit three new messages
    await chatInput.fill('One');
    await chatInput.press('Enter');
    await chatInput.fill('Two');
    await chatInput.press('Enter');
    await chatInput.fill('Three');
    await chatInput.press('Enter');
    // Three edit buttons should show up, one per each message submitted
    const editButtons = chatFrame.locator('.codicon-edit');
    await (0, test_1.expect)(editButtons).toHaveCount(3);
    // Click on the first edit button to get into the editing mode
    // The text area should automatically get the focuse,
    // and contains the original message text,
    // The submit button will also be replaced with "Update Message" button
    await editButtons.nth(0).click();
    await (0, test_1.expect)(chatInput).toBeFocused();
    await (0, test_1.expect)(chatInput).toHaveValue('One');
    await (0, test_1.expect)(updateMessageButton).toBeVisible();
    await (0, test_1.expect)(submitMessageButton).not.toBeVisible();
    // Only 1 cancel button should be displayed above the input box
    await (0, test_1.expect)(cancelEditButton).toHaveCount(1);
    // Pressing escape should exit editing mode,
    // edit buttons should up on each message again
    // and the main chat input box should automatically get the focus back
    await page.keyboard.press('Escape');
    await (0, test_1.expect)(cancelEditButton).not.toBeVisible();
    await (0, test_1.expect)(chatInput).toBeFocused();
    // click on the second edit button to get into the editing mode again
    // edit the message from "Two" to "Four"
    await editButtons.nth(1).click();
    // the original message text should shows up in the text box
    await (0, test_1.expect)(chatInput).toHaveValue('Two');
    await chatInput.click();
    await chatInput.fill('Four');
    await page.keyboard.press('Enter');
    // Only two messages are left after the edit (e.g. "One", "Four"),
    // as all the messages after the edited message have be removed
    await (0, test_1.expect)(editButtons).toHaveCount(2);
    await (0, test_1.expect)(chatFrame.getByText('One')).toBeVisible();
    await (0, test_1.expect)(chatFrame.getByText('Two')).not.toBeVisible();
    await (0, test_1.expect)(chatFrame.getByText('Three')).not.toBeVisible();
    await (0, test_1.expect)(chatFrame.getByText('Four')).toBeVisible();
    // When not in editing mode, there are two buttons above the input box
    // Edit Last Message button and New Chat button
    await (0, test_1.expect)(editLastMessageButton).toBeVisible();
    await (0, test_1.expect)(newChatButton).toBeVisible();
    // "Meta(MacOS)/Control" + "K" should enter the editing mode on the last message
    await chatInput.press(`${osKey}+k`);
    await (0, test_1.expect)(chatInput).toHaveValue('Four');
    // There should be no "New Chat" action button in editing mode
    // But will show up again after exiting editing mode
    await (0, test_1.expect)(newChatButton).not.toBeVisible();
    await chatInput.press('Escape');
    await (0, test_1.expect)(newChatButton).toBeVisible();
    // At-file should work in the edit mode
    await chatInput.press(`${osKey}+k`);
    await (0, test_1.expect)(chatInput).toHaveValue('Four');
    await chatInput.fill('Explain @mj');
    await (0, test_1.expect)(chatInput).not.toHaveValue('Four');
    await (0, test_1.expect)(chatFrame.getByRole('button', { name: 'Main.java' })).toBeVisible();
    await chatInput.press('Tab');
    await (0, test_1.expect)(chatInput).toHaveValue('Explain @Main.java ');
    // Enter should submit the message and exit editing mode
    // The last message should be "Explain @Main.java"
    // With input box emptied with no cancel button
    await chatInput.press('Enter');
    await (0, test_1.expect)(cancelEditButton).not.toBeVisible();
    await (0, test_1.expect)(chatInput).toBeEmpty();
    await (0, test_1.expect)(chatFrame.getByText('Explain @Main.java')).toBeVisible();
    // Add a new at-file to an old messages
    await chatInput.press(`${osKey}+k`);
    await chatInput.type('and @vgo', { delay: 50 });
    await chatInput.press('Tab');
    await (0, test_1.expect)(chatInput).toHaveValue((0, helpers_1.withPlatformSlashes)('Explain @Main.java and @lib/batches/env/var.go '));
    await chatInput.press('Enter');
    // both main.java and var.go should be used
    await (0, test_1.expect)(chatFrame.getByText(/Context: 2 files/)).toBeVisible();
    await chatFrame.getByText(/Context: 2 files/).click();
    await (0, test_1.expect)(chatFrame.getByRole('button', { name: 'Main.java' })).toBeVisible();
    await (0, test_1.expect)(chatFrame.getByRole('button', { name: (0, helpers_1.withPlatformSlashes)('lib/batches/env/var.go') })).toBeVisible();
    // Meta+/ also creates a new chat session
    await chatInput.press(`${osKey}+/`);
    await (0, test_1.expect)(chatFrame.getByText('The End')).not.toBeVisible();
    await (0, test_1.expect)(startNewChatButton).not.toBeVisible();
    // Chat input should still have focus.
    await (0, test_1.expect)(chatInput).toBeFocused();
});
