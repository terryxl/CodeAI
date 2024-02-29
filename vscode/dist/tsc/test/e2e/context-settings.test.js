"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const test_1 = require("@playwright/test");
const common_1 = require("./common");
const helpers_1 = require("./helpers");
helpers_1.test.extend({
    // list of events we expect this test to log, add to this list as needed
    expectedEvents: [
        'CodyVSCodeExtension:auth:clickOtherSignInOptions',
        'CodyVSCodeExtension:login:clicked',
        'CodyVSCodeExtension:auth:selectSigninMenu',
        'CodyVSCodeExtension:auth:fromToken',
        'CodyVSCodeExtension:Auth:connected',
        'CodyVSCodeExtension:useEnhancedContextToggler:clicked',
    ],
})('enhanced context selector is keyboard accessible', async ({ page, sidebar }) => {
    await (0, common_1.sidebarSignin)(page, sidebar);
    const chatFrame = await (0, helpers_1.newChat)(page);
    const contextSettingsButton = chatFrame.getByTitle('Configure Enhanced Context');
    await contextSettingsButton.focus();
    await page.keyboard.press('Space');
    // Opening the enhanced context settings should focus the checkbox for toggling it.
    const enhancedContextCheckbox = chatFrame.locator('#enhanced-context-checkbox');
    await (0, test_1.expect)(enhancedContextCheckbox.and(page.locator(':focus'))).toBeVisible();
    // Enhanced context should be enabled by default.
    await (0, test_1.expect)(enhancedContextCheckbox).toBeChecked();
    await page.keyboard.press('Space');
    // The keyboard should toggle the checkbox, but not dismiss the popup.
    await (0, test_1.expect)(enhancedContextCheckbox).not.toBeChecked();
    await (0, test_1.expect)(enhancedContextCheckbox).toBeVisible();
    // The popup should be dismiss-able with the keyboard.
    await page.keyboard.press('Escape');
    // Closing the enhanced context settings should close the dialog...
    await (0, test_1.expect)(enhancedContextCheckbox).not.toBeVisible();
    // ... and focus the button which re-opens it.
    await (0, test_1.expect)(contextSettingsButton.and(page.locator(':focus'))).toBeVisible();
});
(0, helpers_1.test)('enterprise context selector can pick repos', async ({ page, sidebar, server, expectedEvents }) => {
    const repos1 = {
        repositories: {
            nodes: [
                {
                    id: 'WOOZL',
                    name: 'repo/foo',
                },
            ],
            pageInfo: {
                endCursor: 'WOOZL',
            },
        },
    };
    const repos2 = {
        repositories: {
            nodes: [
                {
                    id: 'WUZLE',
                    name: 'repo/bar',
                },
            ],
            pageInfo: {
                endCursor: null,
            },
        },
    };
    server.onGraphQl('Repositories').replyJson({ data: repos1 }).next().replyJson({ data: repos2 });
    await (0, common_1.sidebarSignin)(page, sidebar);
    const chatFrame = await (0, helpers_1.newChat)(page);
    // Because there are no repositories in the workspace, none should be selected by default.
    await chatFrame.getByTitle('Configure Enhanced Context').click();
    await (0, test_1.expect)(chatFrame.getByText('No repositories selected')).toBeVisible();
    // Choosing a repository should open the repository picker.
    const chooseReposButton = chatFrame.getByRole('button', { name: 'Choose Repositories' });
    await chooseReposButton.click();
    const repoPicker = page.getByText(/Choose up to \d+ more repositories/);
    await (0, test_1.expect)(repoPicker).toBeVisible();
    // Opening the picker should not close the enhanced context status widget.
    await (0, test_1.expect)(chooseReposButton).toBeVisible();
    // Repositories listed on the remote should be present in the picker.
    const repoFoo = page.getByText('repo/foo');
    const repoBar = page.getByText('repo/bar');
    await (0, test_1.expect)(repoFoo).toBeVisible();
    await (0, test_1.expect)(repoBar).toBeVisible();
    // Typing should filter the list of repositories.
    await page.keyboard.type('o/f');
    await (0, test_1.expect)(repoBar).not.toBeVisible();
    // Choosing should dismiss the repo picker, but not the enhanced context
    // settings widget.
    await repoFoo.click();
    await page.keyboard.type('\n');
    await (0, test_1.expect)(repoPicker).not.toBeVisible();
    await (0, test_1.expect)(chooseReposButton).toBeVisible();
    // We need a delay here because the enhanced context settings widget was
    // dismissing after a rerender.
    await new Promise(resolve => setTimeout(resolve, 250));
    // TODO: When https://github.com/sourcegraph/cody/issues/2938 is fixed,
    // expect the choose repos button to be visible.
    await (0, test_1.expect)(chooseReposButton).not.toBeVisible();
    await chatFrame.getByTitle('Configure Enhanced Context').click();
    // The chosen repo should appear in the picker.
    await (0, test_1.expect)(chatFrame.getByTitle('repo/foo').getByText(/^foo$/)).toBeVisible();
});
