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
const vscode_uri_1 = require("vscode-uri");
const cody_shared_1 = require("@sourcegraph/cody-shared");
const display_text_1 = require("./display-text");
(0, vitest_1.describe)('replaceFileNameWithMarkdownLink', () => {
    // Mock a `displayPath` function that always uses forward slashes (even on Windows).
    let orig;
    (0, vitest_1.beforeEach)(() => {
        orig = (0, cody_shared_1.setDisplayPathEnvInfo)({ isWindows: false, workspaceFolders: [vscode_uri_1.URI.file('/')] });
    });
    (0, vitest_1.afterEach)(() => {
        (0, cody_shared_1.setDisplayPathEnvInfo)(orig);
    });
    (0, vitest_1.it)('replaces file name with markdown link', () => {
        (0, vitest_1.expect)((0, display_text_1.replaceFileNameWithMarkdownLink)('Hello @path/to/test.js', vscode_uri_1.URI.file('/path/to/test.js'))).toEqual('Hello [_@path/to/test.js_](command:_cody.vscode.open?%5B%7B%22%24mid%22%3A1%2C%22path%22%3A%22%2Fpath%2Fto%2Ftest.js%22%2C%22scheme%22%3A%22file%22%7D%2C%7B%22preserveFocus%22%3Atrue%2C%22background%22%3Atrue%2C%22preview%22%3Atrue%2C%22viewColumn%22%3A-2%7D%5D)');
    });
    (0, vitest_1.it)('replaces file name with range with markdown link', () => {
        (0, vitest_1.expect)((0, display_text_1.replaceFileNameWithMarkdownLink)('What is @foo.ts:2-2?', vscode_uri_1.URI.file('/foo.ts'), new vscode.Range(2, 0, 2, 0))).toEqual('What is [_@foo.ts:2-2_](command:_cody.vscode.open?%5B%7B%22%24mid%22%3A1%2C%22path%22%3A%22%2Ffoo.ts%22%2C%22scheme%22%3A%22file%22%7D%2C%7B%22selection%22%3A%7B%22start%22%3A%7B%22line%22%3A2%2C%22character%22%3A0%7D%2C%22end%22%3A%7B%22line%22%3A2%2C%22character%22%3A0%7D%7D%2C%22preserveFocus%22%3Atrue%2C%22background%22%3Atrue%2C%22preview%22%3Atrue%2C%22viewColumn%22%3A-2%7D%5D)?');
    });
    (0, vitest_1.it)('replaces file name with symbol with markdown link', () => {
        (0, vitest_1.expect)((0, display_text_1.replaceFileNameWithMarkdownLink)('What is @e2e/cody.ts:2-2#codySymbol?', vscode_uri_1.URI.file('/e2e/cody.ts'), new vscode.Range(2, 0, 2, 0), 'codySymbol')).toEqual('What is [_@e2e/cody.ts:2-2#codySymbol_](command:_cody.vscode.open?%5B%7B%22%24mid%22%3A1%2C%22path%22%3A%22%2Fe2e%2Fcody.ts%22%2C%22scheme%22%3A%22file%22%7D%2C%7B%22selection%22%3A%7B%22start%22%3A%7B%22line%22%3A2%2C%22character%22%3A0%7D%2C%22end%22%3A%7B%22line%22%3A2%2C%22character%22%3A0%7D%7D%2C%22preserveFocus%22%3Atrue%2C%22background%22%3Atrue%2C%22preview%22%3Atrue%2C%22viewColumn%22%3A-2%7D%5D)?');
    });
    (0, vitest_1.it)('respects spaces in file name', () => {
        (0, vitest_1.expect)((0, display_text_1.replaceFileNameWithMarkdownLink)('Loaded @my file.js', vscode_uri_1.URI.file('/my file.js'))).toEqual('Loaded [_@my file.js_](command:_cody.vscode.open?%5B%7B%22%24mid%22%3A1%2C%22path%22%3A%22%2Fmy%20file.js%22%2C%22scheme%22%3A%22file%22%7D%2C%7B%22preserveFocus%22%3Atrue%2C%22background%22%3Atrue%2C%22preview%22%3Atrue%2C%22viewColumn%22%3A-2%7D%5D)');
    });
    (0, vitest_1.describe)('OS-native path separators', () => {
        /** Mimics the behavior of {@link URI.file} on Windows, regardless of the current platform. */
        function windowsFileURI(fsPath) {
            return vscode_uri_1.URI.file(fsPath.replaceAll('\\', '/'));
        }
        // Mock a `displayPath` function that uses backslashes and make sure it's used everywhere.
        let orig;
        (0, vitest_1.beforeEach)(() => {
            orig = (0, cody_shared_1.setDisplayPathEnvInfo)({ isWindows: true, workspaceFolders: [windowsFileURI('C:\\')] });
        });
        (0, vitest_1.afterEach)(() => {
            (0, cody_shared_1.setDisplayPathEnvInfo)(orig);
        });
        (0, vitest_1.it)('uses OS-native path separator', () => {
            (0, vitest_1.expect)((0, display_text_1.replaceFileNameWithMarkdownLink)('Loaded @a\\b.js', windowsFileURI('C:\\a\\b.js'))).toEqual('Loaded [_@a\\b.js_](command:_cody.vscode.open?%5B%7B%22%24mid%22%3A1%2C%22path%22%3A%22%2FC%3A%2Fa%2Fb.js%22%2C%22scheme%22%3A%22file%22%7D%2C%7B%22preserveFocus%22%3Atrue%2C%22background%22%3Atrue%2C%22preview%22%3Atrue%2C%22viewColumn%22%3A-2%7D%5D)');
        });
    });
    (0, vitest_1.it)('returns original text if no match', () => {
        (0, vitest_1.expect)((0, display_text_1.replaceFileNameWithMarkdownLink)('No file name', vscode_uri_1.URI.file('/test.js'))).toEqual('No file name');
    });
    (0, vitest_1.it)('handles special characters in path', () => {
        (0, vitest_1.expect)((0, display_text_1.replaceFileNameWithMarkdownLink)('Loaded @path/with/@#special$chars.js', vscode_uri_1.URI.file('/path/with/@#special$chars.js'))).toEqual('Loaded [_@path/with/@#special$chars.js_](command:_cody.vscode.open?%5B%7B%22%24mid%22%3A1%2C%22path%22%3A%22%2Fpath%2Fwith%2F%40%23special%24chars.js%22%2C%22scheme%22%3A%22file%22%7D%2C%7B%22preserveFocus%22%3Atrue%2C%22background%22%3Atrue%2C%22preview%22%3Atrue%2C%22viewColumn%22%3A-2%7D%5D)');
    });
    (0, vitest_1.it)('handles line numbers', () => {
        (0, vitest_1.expect)((0, display_text_1.replaceFileNameWithMarkdownLink)('Error in @test.js:2-2', vscode_uri_1.URI.file('/test.js'), new vscode.Range(2, 0, 2, 0))).toEqual('Error in [_@test.js:2-2_](command:_cody.vscode.open?%5B%7B%22%24mid%22%3A1%2C%22path%22%3A%22%2Ftest.js%22%2C%22scheme%22%3A%22file%22%7D%2C%7B%22selection%22%3A%7B%22start%22%3A%7B%22line%22%3A2%2C%22character%22%3A0%7D%2C%22end%22%3A%7B%22line%22%3A2%2C%22character%22%3A0%7D%7D%2C%22preserveFocus%22%3Atrue%2C%22background%22%3Atrue%2C%22preview%22%3Atrue%2C%22viewColumn%22%3A-2%7D%5D)');
    });
    (0, vitest_1.it)('handles non alphanumeric characters follows the file name in input', () => {
        (0, vitest_1.expect)((0, display_text_1.replaceFileNameWithMarkdownLink)('What is @test.js:2-2?', vscode_uri_1.URI.file('/test.js'), new vscode.Range(2, 0, 2, 0))).toEqual('What is [_@test.js:2-2_](command:_cody.vscode.open?%5B%7B%22%24mid%22%3A1%2C%22path%22%3A%22%2Ftest.js%22%2C%22scheme%22%3A%22file%22%7D%2C%7B%22selection%22%3A%7B%22start%22%3A%7B%22line%22%3A2%2C%22character%22%3A0%7D%2C%22end%22%3A%7B%22line%22%3A2%2C%22character%22%3A0%7D%7D%2C%22preserveFocus%22%3Atrue%2C%22background%22%3Atrue%2C%22preview%22%3Atrue%2C%22viewColumn%22%3A-2%7D%5D)?');
    });
    (0, vitest_1.it)('handles edge case where start line at 0 - exclude start line in markdown link', () => {
        (0, vitest_1.expect)((0, display_text_1.replaceFileNameWithMarkdownLink)('Error in @test.js', vscode_uri_1.URI.file('/test.js'), new vscode.Range(0, 0, 0, 0))).toEqual('Error in [_@test.js_](command:_cody.vscode.open?%5B%7B%22%24mid%22%3A1%2C%22path%22%3A%22%2Ftest.js%22%2C%22scheme%22%3A%22file%22%7D%2C%7B%22selection%22%3A%7B%22start%22%3A%7B%22line%22%3A0%2C%22character%22%3A0%7D%2C%22end%22%3A%7B%22line%22%3A0%2C%22character%22%3A0%7D%7D%2C%22preserveFocus%22%3Atrue%2C%22background%22%3Atrue%2C%22preview%22%3Atrue%2C%22viewColumn%22%3A-2%7D%5D)');
    });
    (0, vitest_1.it)('handles names that showed up more than once', () => {
        (0, vitest_1.expect)((0, display_text_1.replaceFileNameWithMarkdownLink)('Compare and explain @foo.js:2-2 and @bar.js. What does @foo.js:2-2 do?', vscode_uri_1.URI.file('/foo.js'), new vscode.Range(2, 0, 2, 0))).toEqual('Compare and explain [_@foo.js:2-2_](command:_cody.vscode.open?%5B%7B%22%24mid%22%3A1%2C%22path%22%3A%22%2Ffoo.js%22%2C%22scheme%22%3A%22file%22%7D%2C%7B%22selection%22%3A%7B%22start%22%3A%7B%22line%22%3A2%2C%22character%22%3A0%7D%2C%22end%22%3A%7B%22line%22%3A2%2C%22character%22%3A0%7D%7D%2C%22preserveFocus%22%3Atrue%2C%22background%22%3Atrue%2C%22preview%22%3Atrue%2C%22viewColumn%22%3A-2%7D%5D) and @bar.js. What does [_@foo.js:2-2_](command:_cody.vscode.open?%5B%7B%22%24mid%22%3A1%2C%22path%22%3A%22%2Ffoo.js%22%2C%22scheme%22%3A%22file%22%7D%2C%7B%22selection%22%3A%7B%22start%22%3A%7B%22line%22%3A2%2C%22character%22%3A0%7D%2C%22end%22%3A%7B%22line%22%3A2%2C%22character%22%3A0%7D%7D%2C%22preserveFocus%22%3Atrue%2C%22background%22%3Atrue%2C%22preview%22%3Atrue%2C%22viewColumn%22%3A-2%7D%5D) do?');
    });
    (0, vitest_1.it)('ignores repeated file names that are followed by another character', () => {
        (0, vitest_1.expect)((0, display_text_1.replaceFileNameWithMarkdownLink)('Compare and explain @foo.js:2-2 and @bar.js. What does @foo.js:2-2#FooBar() do?', vscode_uri_1.URI.file('/foo.js'), new vscode.Range(2, 0, 2, 0))).toEqual('Compare and explain [_@foo.js:2-2_](command:_cody.vscode.open?%5B%7B%22%24mid%22%3A1%2C%22path%22%3A%22%2Ffoo.js%22%2C%22scheme%22%3A%22file%22%7D%2C%7B%22selection%22%3A%7B%22start%22%3A%7B%22line%22%3A2%2C%22character%22%3A0%7D%2C%22end%22%3A%7B%22line%22%3A2%2C%22character%22%3A0%7D%7D%2C%22preserveFocus%22%3Atrue%2C%22background%22%3Atrue%2C%22preview%22%3Atrue%2C%22viewColumn%22%3A-2%7D%5D) and @bar.js. What does @foo.js:2-2#FooBar() do?');
    });
    (0, vitest_1.it)('handles file names with line number and symbol name', () => {
        const text = '@vscode/src/logged-rerank.ts:7-23#getRerankWithLog() what does this do';
        const result = (0, display_text_1.replaceFileNameWithMarkdownLink)(text, vscode_uri_1.URI.file('/vscode/src/logged-rerank.ts'), new vscode.Range(7, 0, 23, 0), 'getRerankWithLog()');
        (0, vitest_1.expect)(result).toEqual('[_@vscode/src/logged-rerank.ts:7-23#getRerankWithLog()_](command:_cody.vscode.open?%5B%7B%22%24mid%22%3A1%2C%22path%22%3A%22%2Fvscode%2Fsrc%2Flogged-rerank.ts%22%2C%22scheme%22%3A%22file%22%7D%2C%7B%22selection%22%3A%7B%22start%22%3A%7B%22line%22%3A7%2C%22character%22%3A0%7D%2C%22end%22%3A%7B%22line%22%3A23%2C%22character%22%3A0%7D%7D%2C%22preserveFocus%22%3Atrue%2C%22background%22%3Atrue%2C%22preview%22%3Atrue%2C%22viewColumn%22%3A-2%7D%5D) what does this do');
    });
});
