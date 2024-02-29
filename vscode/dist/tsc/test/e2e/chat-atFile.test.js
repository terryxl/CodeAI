"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const test_1 = require("@playwright/test");
const cody_shared_1 = require("@sourcegraph/cody-shared");
const common_1 = require("./common");
const helpers_1 = require("./helpers");
/**
 * Tests for @-file & @#-symbol in chat
 * See chat-atFile.test.md for the expected behavior for this feature.
 *
 * NOTE: Creating new chats is slow, and setup is slow, so we collapse all these into one test
 */
helpers_1.test.extend({
    // list of events we expect this test to log, add to this list as needed
    expectedEvents: [
        'CodyInstalled',
        'CodyVSCodeExtension:at-mention:executed',
        'CodyVSCodeExtension:at-mention:file:executed',
        'CodyVSCodeExtension:at-mention:symbol:executed',
    ],
})('@-file & @#-symbol in chat view', async ({ page, sidebar }) => {
    await (0, common_1.sidebarSignin)(page, sidebar);
    await page.getByRole('button', { name: 'New Chat', exact: true }).click();
    const chatPanelFrame = page.frameLocator('iframe.webview').last().frameLocator('iframe');
    const chatInput = chatPanelFrame.getByRole('textbox', { name: 'Chat message' });
    await chatInput.click();
    await page.keyboard.type('@');
    await (0, test_1.expect)(chatPanelFrame.getByRole('heading', {
        name: 'Search for a file to include, or type # to search symbols...',
    })).toBeVisible();
    // No results
    await chatInput.click();
    await page.keyboard.type('@definitelydoesntexist');
    await (0, test_1.expect)(chatPanelFrame.getByRole('heading', { name: 'No matching files found' })).toBeVisible();
    // Clear the input so the next test doesn't detect the same text already visible from the previous
    // check (otherwise the test can pass even without the filter working).
    await chatInput.clear();
    // We should only match the relative visible path, not parts of the full path outside of the workspace.
    // Eg. searching for "source" should not find all files if the project is inside `C:\Source`.
    // TODO(dantup): After https://github.com/sourcegraph/cody/pull/2235 lands, add workspacedirectory to the test
    //   and assert that it contains `fixtures` to ensure this check isn't passing because the fixture folder no
    //   longer matches.
    await page.keyboard.type('@fixtures'); // fixture is in the test project folder name, but in the relative paths.
    await (0, test_1.expect)(chatPanelFrame.getByRole('heading', { name: 'No matching files found' })).toBeVisible();
    // Includes dotfiles after just "."
    await chatInput.fill('@.');
    await (0, test_1.expect)(chatPanelFrame.getByRole('button', { name: '.mydotfile' })).toBeVisible();
    // Symbol empty state
    await chatInput.fill('@#');
    await (0, test_1.expect)(chatPanelFrame.getByRole('heading', { name: 'Search for a symbol to include..' })).toBeVisible();
    // Forward slashes
    await chatInput.fill('@lib/batches/env');
    await (0, test_1.expect)(chatPanelFrame.getByRole('button', { name: (0, helpers_1.withPlatformSlashes)('lib/batches/env/var.go') })).toBeVisible();
    // Backslashes
    if ((0, cody_shared_1.isWindows)()) {
        await chatInput.fill('@lib\\batches\\env');
        await (0, test_1.expect)(chatPanelFrame.getByRole('button', { name: (0, helpers_1.withPlatformSlashes)('lib/batches/env/var.go') })).toBeVisible();
    }
    // Searching and clicking
    await chatInput.fill('Explain @mj');
    await chatPanelFrame.getByRole('button', { name: 'Main.java' }).click();
    await (0, test_1.expect)(chatInput).toHaveValue('Explain @Main.java ');
    await chatInput.press('Enter');
    await (0, test_1.expect)(chatInput).toBeEmpty();
    await (0, test_1.expect)(chatPanelFrame.getByText('Explain @Main.java')).toBeVisible();
    await (0, test_1.expect)(chatPanelFrame.getByText(/^✨ Context:/)).toHaveCount(1);
    await (0, test_1.expect)(chatInput).not.toHaveValue('Explain @Main.java ');
    await (0, test_1.expect)(chatPanelFrame.getByRole('button', { name: 'Main.java' })).not.toBeVisible();
    // Use history to re-send a message with context files
    await page.waitForTimeout(50);
    await chatInput.press('ArrowUp', { delay: 50 });
    await (0, test_1.expect)(chatInput).toHaveValue('Explain @Main.java ');
    await chatInput.press('Meta+Enter');
    await (0, test_1.expect)(chatPanelFrame.getByText(/^✨ Context:/)).toHaveCount(2);
    // Keyboard nav through context files
    await chatInput.type('Explain @vgo', { delay: 50 }); // without this delay the following Enter submits the form instead of selecting
    await chatInput.press('Enter');
    await (0, test_1.expect)(chatInput).toHaveValue((0, helpers_1.withPlatformSlashes)('Explain @lib/batches/env/var.go '));
    await chatInput.type('and @vgo', { delay: 50 }); // without this delay the following Enter submits the form instead of selecting
    await chatInput.press('ArrowDown'); // second item (visualize.go)
    await chatInput.press('ArrowDown'); // third item (.vscode/settings.json)
    await chatInput.press('ArrowDown'); // wraps back to first item
    await chatInput.press('ArrowDown'); // second item again
    await chatInput.press('Enter');
    await (0, test_1.expect)(chatInput).toHaveValue((0, helpers_1.withPlatformSlashes)('Explain @lib/batches/env/var.go and @lib/codeintel/tools/lsif-visualize/visualize.go '));
    // Send the message and check it was included
    await chatInput.press('Enter');
    await (0, test_1.expect)(chatInput).toBeEmpty();
    await (0, test_1.expect)(chatPanelFrame.getByText((0, helpers_1.withPlatformSlashes)('Explain @lib/batches/env/var.go and @lib/codeintel/tools/lsif-visualize/visualize.go'))).toBeVisible();
    // Ensure explicitly @-included context shows up as enhanced context
    await (0, test_1.expect)(chatPanelFrame.getByText(/^✨ Context:/)).toHaveCount(3);
    // Check pressing tab after typing a complete filename.
    // https://github.com/sourcegraph/cody/issues/2200
    await chatInput.focus();
    await chatInput.clear();
    await chatInput.type('@Main.java', { delay: 50 });
    await chatInput.press('Tab');
    await (0, test_1.expect)(chatInput).toHaveValue('@Main.java ');
    // Check pressing tab after typing a partial filename but where that complete
    // filename already exists earlier in the input.
    // https://github.com/sourcegraph/cody/issues/2243
    await chatInput.type('and @Main.ja', { delay: 50 });
    await chatInput.press('Tab');
    await (0, test_1.expect)(chatInput).toHaveValue('@Main.java and @Main.java ');
    // Support @-file in mid-sentence
    await chatInput.focus();
    await chatInput.clear();
    await chatInput.type('Explain the file', { delay: 50 });
    await chatInput.press('ArrowLeft'); // 'Explain the fil|e'
    await chatInput.press('ArrowLeft'); // 'Explain the fi|le'
    await chatInput.press('ArrowLeft'); // 'Explain the f|ile'
    await chatInput.press('ArrowLeft'); // 'Explain the |file'
    await chatInput.press('ArrowLeft'); // 'Explain the| file'
    await chatInput.press('Space'); // 'Explain the | file'
    await chatInput.type('@Main', { delay: 50 });
    await chatInput.press('Tab');
    await (0, test_1.expect)(chatInput).toHaveValue('Explain the @Main.java file');
    // Confirm the cursor is at the end of the newly added file name with space
    await page.keyboard.type('!');
    await (0, test_1.expect)(chatInput).toHaveValue('Explain the @Main.java !file');
    //  "ArrowLeft" / "ArrowRight" keys close the selection without altering current input.
    const noMatches = chatPanelFrame.getByRole('heading', { name: 'No matching files found' });
    await chatInput.type(' @abcdefg', { delay: 50 });
    await (0, test_1.expect)(chatInput).toHaveValue('Explain the @Main.java ! @abcdefgfile');
    await noMatches.hover();
    await (0, test_1.expect)(noMatches).toBeVisible();
    await chatInput.press('ArrowLeft');
    await (0, test_1.expect)(noMatches).not.toBeVisible();
    await chatInput.press('ArrowRight');
    await (0, test_1.expect)(noMatches).not.toBeVisible();
    await chatInput.type('?', { delay: 50 });
    await (0, test_1.expect)(chatInput).toHaveValue('Explain the @Main.java ! @abcdefg?file');
    await noMatches.hover();
    await (0, test_1.expect)(noMatches).toBeVisible();
    // Selection close on submit
    await chatInput.press('Enter');
    await (0, test_1.expect)(noMatches).not.toBeVisible();
    await (0, test_1.expect)(chatInput).toBeEmpty();
    // Query ends with non-alphanumeric character
    // with no results should not show selector.
    await chatInput.focus();
    await chatInput.fill('@unknown');
    await (0, test_1.expect)(noMatches).toBeVisible();
    await chatInput.press('?');
    await (0, test_1.expect)(chatInput).toHaveValue('@unknown?');
    await (0, test_1.expect)(noMatches).not.toBeVisible();
    await chatInput.press('Backspace');
    await (0, test_1.expect)(noMatches).toBeVisible();
    // Typing out the whole file path without pressing tab/enter should still include the
    // file as context
    const osKey = (0, helpers_1.getMetaKeyByOS)();
    await chatInput.press(`${osKey}+/`); // start a new chat
    await chatInput.fill('@index.htm');
    await chatInput.press('l');
    await (0, test_1.expect)(chatPanelFrame.getByRole('button', { name: 'index.html' })).toBeVisible();
    await chatInput.press('Space');
    await page.keyboard.type('explain.', { delay: 50 });
    await chatInput.press('Enter');
    await (0, test_1.expect)(chatPanelFrame.getByText(/^✨ Context:/)).toHaveCount(1);
});
