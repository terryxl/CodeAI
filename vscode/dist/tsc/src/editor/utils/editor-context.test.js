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
const vitest_1 = require("vitest");
const vscode = __importStar(require("vscode"));
const cody_shared_1 = require("@sourcegraph/cody-shared");
const editor_context_1 = require("./editor-context");
vitest_1.vi.mock('lodash/throttle', () => ({ default: vitest_1.vi.fn(fn => fn) }));
(0, vitest_1.afterEach)(() => {
    vitest_1.vi.clearAllMocks();
});
(0, vitest_1.describe)('getFileContextFiles', () => {
    /**
     * Mocks the fs.stat function to return a fake stat object for the given URI.
     * This allows tests to mock filesystem access for specific files.
     */
    function setFileStat(uri, isFile = true) {
        vscode.workspace.fs.stat = vitest_1.vi.fn().mockImplementation(() => {
            const relativePath = (0, cody_shared_1.uriBasename)(uri);
            return {
                type: isFile ? vscode.FileType.File : vscode.FileType.SymbolicLink,
                ctime: 1,
                mtime: 1,
                size: 1,
                isDirectory: () => false,
                isFile: () => isFile,
                isSymbolicLink: () => !isFile,
                uri,
                with: vitest_1.vi.fn(),
                toString: vitest_1.vi.fn().mockReturnValue(relativePath),
            };
        });
    }
    function setFiles(relativePaths) {
        vscode.workspace.findFiles = vitest_1.vi
            .fn()
            .mockResolvedValueOnce(relativePaths.map(f => (0, cody_shared_1.testFileUri)(f)));
        for (const relativePath of relativePaths) {
            const isFile = relativePath !== 'symlink';
            setFileStat((0, cody_shared_1.testFileUri)(relativePath), isFile);
        }
    }
    async function runSearch(query, maxResults) {
        const results = await (0, editor_context_1.getFileContextFiles)(query, maxResults, new vscode.CancellationTokenSource().token);
        return results.map(f => (0, cody_shared_1.uriBasename)(f.uri));
    }
    (0, vitest_1.it)('fuzzy filters results', async () => {
        setFiles(['foo/bar/baz/file.go', 'foo/bar/File/go-has-parts', 'foo/bar/baz/FileWontMatch.ts']);
        (0, vitest_1.expect)(await runSearch('filego', 5)).toMatchInlineSnapshot(`
          [
            "go-has-parts",
            "file.go",
          ]
        `);
        (0, vitest_1.expect)(vscode.workspace.findFiles).toBeCalledTimes(1);
    });
    (0, vitest_1.it)('ranks bin/ low if "bin" has not been typed', async () => {
        setFiles(['bin/main.dart', 'abcdefghijbklmn.dart']);
        (0, vitest_1.expect)(await runSearch('bi', 5)).toMatchInlineSnapshot(`
          [
            "abcdefghijbklmn.dart",
            "main.dart",
          ]
        `);
        (0, vitest_1.expect)(vscode.workspace.findFiles).toBeCalledTimes(1);
    });
    (0, vitest_1.it)('ranks bin/ normally if "bin" has been typed', async () => {
        setFiles(['bin/main.dart', 'abcdefghijbklmn.dart']);
        (0, vitest_1.expect)(await runSearch('bin', 5)).toMatchInlineSnapshot(`
          [
            "main.dart",
            "abcdefghijbklmn.dart",
          ]
        `);
        (0, vitest_1.expect)(vscode.workspace.findFiles).toBeCalledTimes(1);
    });
    (0, vitest_1.it)('do not return non-file (e.g. symlinks) result', async () => {
        setFiles(['symlink']);
        (0, vitest_1.expect)(await runSearch('symlink', 5)).toMatchInlineSnapshot(`
          []
        `);
        (0, vitest_1.expect)(vscode.workspace.findFiles).toBeCalledTimes(1);
    });
    (0, vitest_1.it)('filters out ignored files', async () => {
        cody_shared_1.ignores.setActiveState(true);
        cody_shared_1.ignores.setIgnoreFiles((0, cody_shared_1.testFileUri)(''), [
            { uri: (0, cody_shared_1.testFileUri)('.cody/ignore'), content: '*.ignore' },
        ]);
        setFiles(['foo.txt', 'foo.ignore']);
        // Match the .txt but not the .ignore
        (0, vitest_1.expect)(await runSearch('foo', 5)).toMatchInlineSnapshot(`
          [
            "foo.txt",
          ]
        `);
        (0, vitest_1.expect)(vscode.workspace.findFiles).toBeCalledTimes(1);
    });
    (0, vitest_1.it)('cancels previous requests', async () => {
        vscode.workspace.findFiles = vitest_1.vi.fn().mockResolvedValueOnce([]);
        const cancellation = new vscode.CancellationTokenSource();
        await (0, editor_context_1.getFileContextFiles)('search', 5, cancellation.token);
        await (0, editor_context_1.getFileContextFiles)('search', 5, new vscode.CancellationTokenSource().token);
        (0, vitest_1.expect)(cancellation.token.isCancellationRequested);
        (0, vitest_1.expect)(vscode.workspace.findFiles).toBeCalledTimes(2);
    });
});
