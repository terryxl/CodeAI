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
exports.getMetaKeyByOS = exports.withPlatformSlashes = exports.newChat = exports.openFile = exports.spawn = exports.withTempDir = exports.assertEvents = exports.executeCommandInPalette = exports.signOut = exports.test = void 0;
const child_process = __importStar(require("child_process"));
const fs_1 = require("fs");
const os = __importStar(require("os"));
const path = __importStar(require("path"));
const test_1 = require("@playwright/test");
const playwright_1 = require("playwright");
const uuid = __importStar(require("uuid"));
const mock_server_1 = require("../fixtures/mock-server");
const install_deps_1 = require("./install-deps");
exports.test = test_1.test
    // By default, use ../../test/fixtures/workspace as the workspace.
    .extend({
    // biome-ignore lint/correctness/noEmptyPattern: Playwright needs empty pattern to specify "no dependencies".
    workspaceDirectory: async ({}, use) => {
        const vscodeRoot = path.resolve(__dirname, '..', '..');
        const workspaceDirectory = path.join(vscodeRoot, 'test', 'fixtures', 'workspace');
        await use(workspaceDirectory);
    },
})
    // By default, do not add any extra workspace settings.
    .extend({
    extraWorkspaceSettings: {
        'cody.experimental.symfContext': false,
        // NOTE: Enable unstable features for testing.
        'cody.internal.unstable': true,
    },
})
    // By default, treat https://sourcegraph.com as "dotcom".
    .extend({
    dotcomUrl: undefined,
})
    // By default, these events should always fire for each test
    .extend({
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
    // biome-ignore lint/correctness/noEmptyPattern: Playwright ascribes meaning to the empty pattern: No dependencies.
    server: async ({}, use) => {
        mock_server_1.MockServer.run(async (server) => {
            await use(server);
        });
    },
})
    .extend({
    page: async ({ page: _page, workspaceDirectory, extraWorkspaceSettings, dotcomUrl, server: MockServer, expectedEvents, }, use, testInfo) => {
        void _page;
        const vscodeRoot = path.resolve(__dirname, '..', '..');
        const vscodeExecutablePath = await (0, install_deps_1.installVsCode)();
        const extensionDevelopmentPath = vscodeRoot;
        const userDataDirectory = (0, fs_1.mkdtempSync)(path.join(os.tmpdir(), 'cody-vsce'));
        const extensionsDirectory = (0, fs_1.mkdtempSync)(path.join(os.tmpdir(), 'cody-vsce'));
        const videoDirectory = path.join(vscodeRoot, '..', 'playwright', escapeToPath(testInfo.title));
        await buildWorkSpaceSettings(workspaceDirectory, extraWorkspaceSettings);
        await buildCodyJson(workspaceDirectory);
        (0, mock_server_1.sendTestInfo)(testInfo.title, testInfo.testId, uuid.v4());
        let dotcomUrlOverride = {};
        if (dotcomUrl) {
            dotcomUrlOverride = { TESTING_DOTCOM_URL: dotcomUrl };
        }
        // See: https://github.com/microsoft/vscode-test/blob/main/lib/runTest.ts
        const app = await playwright_1._electron.launch({
            executablePath: vscodeExecutablePath,
            env: {
                ...process.env,
                ...dotcomUrlOverride,
                CODY_TESTING: 'true',
            },
            args: [
                // https://github.com/microsoft/vscode/issues/84238
                '--no-sandbox',
                // https://github.com/microsoft/vscode-test/issues/120
                '--disable-updates',
                '--skip-welcome',
                '--skip-release-notes',
                '--disable-workspace-trust',
                `--extensionDevelopmentPath=${extensionDevelopmentPath}`,
                `--user-data-dir=${userDataDirectory}`,
                `--extensions-dir=${extensionsDirectory}`,
                workspaceDirectory,
            ],
            recordVideo: {
                dir: videoDirectory,
            },
        });
        await waitUntil(() => app.windows().length > 0);
        const page = await app.firstWindow();
        // Bring the cody sidebar to the foreground if not already visible
        if (!(await page.getByRole('heading', { name: 'Cody: Chat' }).isVisible())) {
            await page.click('[aria-label="Cody"]');
        }
        // Ensure that we remove the hover from the activity icon
        await page.getByRole('heading', { name: 'Cody: Chat' }).hover();
        // Wait for Cody to become activated
        // TODO(philipp-spiess): Figure out which playwright matcher we can use that works for
        // the signed-in and signed-out cases
        await new Promise(resolve => setTimeout(resolve, 500));
        // Ensure we're signed out.
        if (await page.isVisible('[aria-label="User Settings"]')) {
            await signOut(page);
        }
        await use(page);
        // Critical test to prevent event logging regressions.
        // Do not remove without consulting data analytics team.
        try {
            await assertEvents(mock_server_1.loggedEvents, expectedEvents);
        }
        catch (error) {
            console.error('Expected events do not match actual events!');
            console.log('Expected:', expectedEvents);
            console.log('Logged:', mock_server_1.loggedEvents);
            throw error;
        }
        (0, mock_server_1.resetLoggedEvents)();
        await app.close();
        // Delete the recorded video if the test passes
        if (testInfo.status === 'passed') {
            await rmSyncWithRetries(videoDirectory, { recursive: true });
        }
        await rmSyncWithRetries(userDataDirectory, { recursive: true });
        await rmSyncWithRetries(extensionsDirectory, { recursive: true });
    },
})
    .extend({
    sidebar: async ({ page }, use) => {
        const sidebar = await getCodySidebar(page);
        await use(sidebar);
    },
});
/**
 * Calls rmSync(path, options) and retries a few times if it fails before throwing.
 *
 * This reduces the chance of errors caused by timing of other processes that may have files locked, such as
 *
 *    Error: EBUSY: resource busy or locked,
 *      unlink '\\?\C:\Users\RUNNER~1\AppData\Local\Temp\cody-vsced30WGT\Crashpad\metadata'
 */
async function rmSyncWithRetries(path, options) {
    const maxAttempts = 5;
    let attempts = maxAttempts;
    while (attempts-- >= 0) {
        try {
            (0, fs_1.rmSync)(path, options);
            break;
        }
        catch (error) {
            if (attempts === 1) {
                throw new Error(`Failed to rmSync ${path} after ${maxAttempts} attempts: ${error}`);
            }
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }
}
async function getCodySidebar(page) {
    async function findCodySidebarFrame() {
        for (const frame of page.frames()) {
            try {
                const title = await frame.title();
                if (title === 'Cody') {
                    return frame;
                }
            }
            catch (error) {
                // Skip over frames that were detached in the meantime.
                if (error.message.indexOf('Frame was detached') === -1) {
                    throw error;
                }
            }
        }
        return null;
    }
    await waitUntil(async () => (await findCodySidebarFrame()) !== null);
    return (await findCodySidebarFrame()) || page.mainFrame();
}
async function waitUntil(predicate) {
    let delay = 10;
    while (!(await predicate())) {
        await new Promise(resolve => setTimeout(resolve, delay));
        delay <<= 1;
    }
}
function escapeToPath(text) {
    return text.replaceAll(/\W/g, '_');
}
// Build a workspace settings file that enables the experimental inline mode
async function buildWorkSpaceSettings(workspaceDirectory, extraSettings) {
    const settings = {
        'cody.serverEndpoint': 'http://localhost:49300',
        'cody.commandCodeLenses': true,
        'cody.editorTitleCommandIcon': true,
        ...extraSettings,
    };
    // create a temporary directory with settings.json and add to the workspaceDirectory
    const workspaceSettingsPath = path.join(workspaceDirectory, '.vscode', 'settings.json');
    const workspaceSettingsDirectory = path.join(workspaceDirectory, '.vscode');
    await new Promise((resolve, reject) => {
        (0, fs_1.mkdir)(workspaceSettingsDirectory, { recursive: true }, err => err ? reject(err) : resolve(undefined));
    });
    await new Promise((resolve, reject) => {
        (0, fs_1.writeFile)(workspaceSettingsPath, JSON.stringify(settings), error => {
            if (error) {
                reject(error);
            }
            else {
                resolve();
            }
        });
    });
}
// Build a cody.json file for testing custom commands and context fetching
async function buildCodyJson(workspaceDirectory) {
    const codyJson = {
        currentDir: {
            description: "Should have 4 context files from the current directory. Files start with '.' are skipped by default.",
            prompt: 'Add four context files from the current directory.',
            context: {
                selection: false,
                currentDir: true,
            },
        },
        filePath: {
            prompt: 'Add lib/batches/env/var.go as context.',
            context: {
                filePath: 'lib/batches/env/var.go',
            },
        },
        directoryPath: {
            description: 'Get files from directory.',
            prompt: 'Directory has one context file.',
            context: {
                directoryPath: 'lib/batches/env',
            },
        },
        openTabs: {
            description: 'Get files from open tabs.',
            prompt: 'Open tabs as context.',
            context: {
                selection: false,
                openTabs: true,
            },
        },
        invalid: {
            description: 'Command without prompt should not break the custom command menu.',
            note: 'This is used for validating the custom command UI to avoid cases where an invalid command entry prevents all custom commands from showing up in the menu.',
        },
    };
    // add file to the .vscode directory created in the buildWorkSpaceSettings step
    const codyJsonPath = path.join(workspaceDirectory, '.vscode', 'cody.json');
    await new Promise((resolve, reject) => {
        (0, fs_1.writeFile)(codyJsonPath, JSON.stringify(codyJson), error => {
            if (error) {
                reject(error);
            }
            else {
                resolve();
            }
        });
    });
}
async function signOut(page) {
    // TODO(sqs): could simplify this further with a cody.auth.signoutAll command
    await executeCommandInPalette(page, 'cody sign out');
}
exports.signOut = signOut;
async function executeCommandInPalette(page, commandName) {
    // TODO(sqs): could simplify this further with a cody.auth.signoutAll command
    await page.keyboard.press('F1');
    await page.getByRole('combobox', { name: 'input' }).fill(`>${commandName}`);
    await page.keyboard.press('Enter');
}
exports.executeCommandInPalette = executeCommandInPalette;
/**
 * Verifies that loggedEvents contain all of expectedEvents (in any order).
 */
async function assertEvents(loggedEvents, expectedEvents) {
    await test_1.expect.poll(() => loggedEvents).toEqual(test_1.expect.arrayContaining(expectedEvents));
}
exports.assertEvents = assertEvents;
// Creates a temporary directory, calls `f`, and then deletes the temporary
// directory when done.
async function withTempDir(f) {
    // Create the temporary directory
    const dir = (0, fs_1.mkdtempSync)(path.join(os.tmpdir(), 'cody-vsce'));
    try {
        return await f(dir);
    }
    finally {
        // Remove the temporary directory
        await fs_1.promises.rm(dir, { recursive: true, force: true });
    }
}
exports.withTempDir = withTempDir;
// Runs a program (see `child_process.spawn`) and waits until it exits. Throws
// if the child exits with a non-zero exit code or signal.
function spawn(...args) {
    return new Promise((resolve, reject) => {
        const child = child_process.spawn(...args);
        child.once('close', (code, signal) => {
            if (code || signal) {
                reject(new Error(`child exited with code ${code}/signal ${signal}`));
            }
            else {
                resolve();
            }
        });
    });
}
exports.spawn = spawn;
// Uses VSCode command palette to open a file by typing its name.
async function openFile(page, filename) {
    // Open a file from the file picker
    await page.keyboard.down('Control');
    await page.keyboard.down('Shift');
    await page.keyboard.press('P');
    await page.keyboard.up('Shift');
    await page.keyboard.up('Control');
    await page.keyboard.type(`${filename}\n`);
}
exports.openFile = openFile;
// Starts a new panel chat and returns a FrameLocator for the chat.
async function newChat(page) {
    await page.getByRole('button', { name: 'New Chat' }).click();
    return page.frameLocator('iframe.webview').last().frameLocator('iframe');
}
exports.newChat = newChat;
function withPlatformSlashes(input) {
    return input.replaceAll(path.posix.sep, path.sep);
}
exports.withPlatformSlashes = withPlatformSlashes;
const isPlatform = (platform) => process.platform === platform;
function getMetaKeyByOS() {
    return isPlatform('darwin') ? 'Meta' : 'Control';
}
exports.getMetaKeyByOS = getMetaKeyByOS;
