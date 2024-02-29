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
const fs_1 = require("fs");
const path = __importStar(require("path"));
const test_1 = require("@playwright/test");
const mock_server_1 = require("../fixtures/mock-server");
const common_1 = require("./common");
const helpers = __importStar(require("./helpers"));
const helpers_1 = require("./helpers");
// Reconfigured test for local embeddings:
// - treats http://localhost:49000 as dotcom
// - uses a temporary workspace that's a git repository
// - uses a temporary directory for local embeddings indexes
// - uses the stub/stub embeddings model
const test = helpers.test
    .extend({
    dotcomUrl: mock_server_1.SERVER_URL,
})
    .extend({
    // list of events we expect this test to log, add to this list as needed
    expectedEvents: [
        'CodyInstalled',
        'CodyVSCodeExtension:auth:clickOtherSignInOptions',
        'CodyVSCodeExtension:login:clicked',
        'CodyVSCodeExtension:auth:selectSigninMenu',
        'CodyVSCodeExtension:auth:fromToken',
        'CodyVSCodeExtension:Auth:connected',
    ],
})
    .extend({
    // biome-ignore lint/correctness/noEmptyPattern: Playwright needs empty pattern to specify "no dependencies".
    workspaceDirectory: async ({}, use) => {
        await (0, helpers_1.withTempDir)(async (dir) => {
            // Initialize a git repository there
            await (0, helpers_1.spawn)('git', ['init'], { cwd: dir });
            await (0, helpers_1.spawn)('git', ['config', 'user.name', 'Test User'], {
                cwd: dir,
            });
            await (0, helpers_1.spawn)('git', ['config', 'user.email', 'test@example.host'], { cwd: dir });
            // Commit some content to the git repository.
            await Promise.all([
                fs_1.promises.writeFile(path.join(dir, 'README.md'), 'Prints an classic greeting'),
                fs_1.promises.writeFile(path.join(dir, 'main.c'), '#include <stdio.h> main() { printf("Hello, world.\\n"); }'),
            ]);
            await (0, helpers_1.spawn)('git', ['add', 'README.md', 'main.c'], { cwd: dir });
            await (0, helpers_1.spawn)('git', ['commit', '-m', 'Initial commit'], {
                cwd: dir,
            });
            await use(dir);
        });
    },
})
    .extend({
    // biome-ignore lint/correctness/noEmptyPattern: Playwright needs empty pattern to specify "no dependencies".
    extraWorkspaceSettings: async ({}, use) => {
        await (0, helpers_1.withTempDir)(async (dir) => use({
            'cody.testing.localEmbeddings.model': 'stub/stub',
            'cody.testing.localEmbeddings.indexLibraryPath': dir,
        }));
    },
});
test.beforeAll(() => {
    // These tests depend on downloading cody-engine, which can be slow.
    test.slow();
});
test.extend({
    // biome-ignore lint/correctness/noEmptyPattern: Playwright needs empty pattern to specify "no dependencies".
    workspaceDirectory: async ({}, use) => {
        await (0, helpers_1.withTempDir)(async (dir) => {
            // Write some content to the filesystem. But this is not a git repository.
            await Promise.all([
                fs_1.promises.writeFile(path.join(dir, 'README.md'), 'Prints an classic greeting'),
                fs_1.promises.writeFile(path.join(dir, 'main.c'), '#include <stdio.h> main() { printf("Hello, world.\\n"); }'),
            ]);
            await use(dir);
        });
    },
})('non-git repositories should explain lack of embeddings', async ({ page, sidebar }) => {
    await (0, helpers_1.openFile)(page, 'main.c');
    await (0, common_1.sidebarSignin)(page, sidebar);
    const chatFrame = await (0, helpers_1.newChat)(page);
    const enhancedContextButton = chatFrame.getByTitle('Configure Enhanced Context');
    await enhancedContextButton.click();
    // Embeddings is visible at first as cody-engine starts...
    await (0, test_1.expect)(chatFrame.getByText('Embeddings')).toBeVisible();
    // ...and displays this message when the engine works out this is not a git repo.
    await (0, test_1.expect)(chatFrame.locator('.codicon-circle-slash')).toBeVisible({
        timeout: 60000,
    });
    await (0, test_1.expect)(chatFrame.getByText('Folder is not a Git repository.')).toBeVisible();
});
test('git repositories without a remote should explain the issue', async ({ page, sidebar }) => {
    await (0, helpers_1.openFile)(page, 'main.c');
    await (0, common_1.sidebarSignin)(page, sidebar);
    const chatFrame = await (0, helpers_1.newChat)(page);
    const enhancedContextButton = chatFrame.getByTitle('Configure Enhanced Context');
    await enhancedContextButton.click();
    await (0, test_1.expect)(chatFrame.locator('.codicon-circle-slash')).toBeVisible({
        timeout: 60000,
    });
    await (0, test_1.expect)(chatFrame.getByText('Git repository is missing a remote origin.')).toBeVisible();
});
test
    .extend({
    workspaceDirectory: async ({ workspaceDirectory }, use) => {
        // Add a remote to the git repo so that it can be indexed.
        await (0, helpers_1.spawn)('git', ['remote', 'add', 'origin', 'git@host.example:user/repo.git'], {
            cwd: workspaceDirectory,
        });
        await use(workspaceDirectory);
    },
})
    .extend({
    expectedEvents: [
        'CodyVSCodeExtension:auth:clickOtherSignInOptions',
        'CodyVSCodeExtension:login:clicked',
        'CodyVSCodeExtension:auth:selectSigninMenu',
        'CodyVSCodeExtension:auth:fromToken',
        'CodyVSCodeExtension:Auth:connected',
        'CodyVSCodeExtension:chat-question:submitted',
        'CodyVSCodeExtension:chat-question:executed',
    ],
})('should be able to index, then search, a git repository', async ({ page, sidebar }) => {
    await (0, helpers_1.openFile)(page, 'main.c');
    await (0, common_1.sidebarSignin)(page, sidebar);
    const chatFrame = await (0, helpers_1.newChat)(page);
    const enhancedContextButton = chatFrame.getByTitle('Configure Enhanced Context');
    await enhancedContextButton.click();
    const enableEmbeddingsButton = chatFrame.getByText('Enable Embeddings');
    // This may take a while, we download and start cody-engine
    await (0, test_1.expect)(enableEmbeddingsButton).toBeVisible({ timeout: 60000 });
    await enableEmbeddingsButton.click();
    await (0, test_1.expect)(chatFrame.getByText('Embeddings — Indexed')).toBeVisible({
        timeout: 30000,
    });
    // Search the embeddings. This test uses the "stub" embedding model, which
    // is deterministic, but the searches are not semantic.
    await chatFrame.locator('textarea').type('hello world\n');
    await (0, test_1.expect)(chatFrame.getByText(/✨ Context: \d+ lines from 2 files/)).toBeVisible({
        timeout: 10000,
    });
});
