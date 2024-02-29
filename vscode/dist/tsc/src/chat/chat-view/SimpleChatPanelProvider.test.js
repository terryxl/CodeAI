"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const vscode_uri_1 = require("vscode-uri");
require("../../testutils/vscode");
const SimpleChatPanelProvider_1 = require("./SimpleChatPanelProvider");
(0, vitest_1.describe)('contextFilesToContextItems', () => {
    (0, vitest_1.test)('omits files that could not be read', async () => {
        // Fixes https://github.com/sourcegraph/cody/issues/2390.
        const mockEditor = {
            getTextEditorContentForFile(uri) {
                if (uri.path === '/a.txt') {
                    return Promise.resolve('a');
                }
                throw new Error('error');
            },
        };
        const contextItems = await (0, SimpleChatPanelProvider_1.contextFilesToContextItems)(mockEditor, [
            {
                type: 'file',
                uri: vscode_uri_1.URI.parse('file:///a.txt'),
            },
            {
                type: 'file',
                uri: vscode_uri_1.URI.parse('file:///error.txt'),
            },
        ], true);
        (0, vitest_1.expect)(contextItems).toEqual([{ uri: vscode_uri_1.URI.parse('file:///a.txt'), text: 'a' }]);
    });
});
