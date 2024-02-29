"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const cody_shared_1 = require("@sourcegraph/cody-shared");
const utils_1 = require("../chat/utils");
const mocks_1 = require("../testutils/mocks");
const TreeViewProvider_1 = require("./TreeViewProvider");
vitest_1.vi.mock('vscode', () => ({
    ...mocks_1.vsCodeMocks,
    env: {},
}));
(0, vitest_1.describe)('TreeViewProvider', () => {
    const siteVersion = '';
    const verifiedEmail = true;
    const codyEnabled = true;
    const validUser = true;
    const username = 'cody';
    const primaryEmail = 'me@domain.test';
    const displayName = 'Test Name';
    const avatarURL = 'https://domain.test/avatar.png';
    let tree;
    /**
     * Waits for the tree to fire its onDidChangeTreeData
     */
    async function waitForTreeUpdate() {
        let sub;
        return new Promise(resolve => {
            sub = tree.onDidChangeTreeData(() => {
                sub.dispose();
                resolve();
            });
        });
    }
    /**
     * Refreshes the tree with the new auth flags and waits for the update.
     */
    async function updateTree({ upgradeAvailable, endpoint, }) {
        const nextUpdate = waitForTreeUpdate();
        tree.syncAuthStatus((0, utils_1.newAuthStatus)(endpoint.toString(), (0, cody_shared_1.isDotCom)(endpoint.toString()), validUser, verifiedEmail, codyEnabled, upgradeAvailable, siteVersion, avatarURL, username, displayName, primaryEmail));
        return nextUpdate;
    }
    async function findTreeItem(label) {
        const items = await tree.getChildren();
        return items.find(item => item.resourceUri?.label === label);
    }
    (0, vitest_1.describe)('Cody Pro Upgrade', () => {
        (0, vitest_1.it)('is shown when user can upgrade', async () => {
            tree = new TreeViewProvider_1.TreeViewProvider('support', mocks_1.emptyMockFeatureFlagProvider);
            await updateTree({ upgradeAvailable: true, endpoint: cody_shared_1.DOTCOM_URL });
            (0, vitest_1.expect)(await findTreeItem('Upgrade')).not.toBeUndefined();
        });
        (0, vitest_1.it)('is not shown when user cannot upgrade', async () => {
            tree = new TreeViewProvider_1.TreeViewProvider('support', mocks_1.emptyMockFeatureFlagProvider);
            await updateTree({ upgradeAvailable: false, endpoint: cody_shared_1.DOTCOM_URL });
            (0, vitest_1.expect)(await findTreeItem('Upgrade')).toBeUndefined();
        });
        (0, vitest_1.it)('is not shown when not dotCom regardless of GA or upgrade flags', async () => {
            tree = new TreeViewProvider_1.TreeViewProvider('support', mocks_1.emptyMockFeatureFlagProvider);
            await updateTree({ upgradeAvailable: true, endpoint: new URL('https://example.org') });
            (0, vitest_1.expect)(await findTreeItem('Upgrade')).toBeUndefined();
        });
    });
});
