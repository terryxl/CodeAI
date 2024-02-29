"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sidebarExplorer = exports.sidebarSignin = void 0;
const test_1 = require("@playwright/test");
const mock_server_1 = require("../fixtures/mock-server");
const helpers_1 = require("./helpers");
// Sign into Cody with valid auth from the sidebar
const sidebarSignin = async (page, sidebar, enableNotifications = false) => {
    await sidebar.getByRole('button', { name: 'Sign In to Your Enterprise Instance' }).click();
    await page.getByRole('option', { name: 'Sign In with URL and Access Token' }).click();
    await page.getByRole('combobox', { name: 'input' }).fill(mock_server_1.SERVER_URL);
    await page.getByRole('combobox', { name: 'input' }).press('Enter');
    await page.getByRole('combobox', { name: 'input' }).fill(mock_server_1.VALID_TOKEN);
    await page.getByRole('combobox', { name: 'input' }).press('Enter');
    // Turn off notification
    if (!enableNotifications) {
        await disableNotifications(page);
    }
    await (0, test_1.expect)(page.getByText('Chat alongside your code, attach files,')).toBeVisible();
};
exports.sidebarSignin = sidebarSignin;
// Selector for the Explorer button in the sidebar that would match on Mac and Linux
const sidebarExplorerRole = { name: /Explorer.*/ };
const sidebarExplorer = (page) => page.getByRole('tab', sidebarExplorerRole);
exports.sidebarExplorer = sidebarExplorer;
async function disableNotifications(page) {
    // Use the command to toggle DND mode because the UI differs on Windows/non-Windows since 1.86 with
    // macOS appearing to use a native menu where Windows uses a VS Code-drawn menu.
    await (0, helpers_1.executeCommandInPalette)(page, 'notifications: toggle do not disturb');
}
