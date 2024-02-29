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
const cody_shared_1 = require("@sourcegraph/cody-shared");
const vscode = __importStar(require("../../testutils/mocks"));
const chat_helpers_1 = require("./chat-helpers");
(0, vitest_1.describe)('unwrap context snippets', () => {
    (0, vitest_1.test)('should wrap and unwrap context item snippets', () => {
        const testCases = [
            {
                contextItem: {
                    uri: (0, cody_shared_1.testFileUri)('test.ts'),
                    range: new vscode.Range(0, 1, 2, 3),
                    source: 'editor',
                    text: '// This is code context',
                },
            },
            {
                contextItem: {
                    uri: (0, cody_shared_1.testFileUri)('doc.md'),
                    range: new vscode.Range(0, 1, 2, 3),
                    source: 'editor',
                    text: 'This is markdown context',
                },
            },
        ];
        for (const testCase of testCases) {
            const contextFiles = (0, chat_helpers_1.contextItemsToContextFiles)([testCase.contextItem]);
            const contextMessages = cody_shared_1.CodebaseContext.makeContextMessageWithResponse({
                file: contextFiles[0],
                results: [contextFiles[0].content || ''],
            });
            const contextItem = (0, chat_helpers_1.contextMessageToContextItem)(contextMessages[0]);
            (0, vitest_1.expect)(prettyJSON(contextItem)).toEqual(prettyJSON(testCase.contextItem));
        }
    });
    (0, vitest_1.test)('should unwrap context from context message', () => {
        const testCases = [
            {
                input: (0, cody_shared_1.populateCurrentEditorSelectedContextTemplate)('// This is the code', (0, cody_shared_1.testFileUri)('test.ts')),
                expOut: '// This is the code',
            },
            {
                input: (0, cody_shared_1.populateCurrentSelectedCodeContextTemplate)('// This is the code', (0, cody_shared_1.testFileUri)('test.ts')),
                expOut: '// This is the code',
            },
        ];
        for (const testCase of testCases) {
            const output = (0, chat_helpers_1.stripContextWrapper)(testCase.input);
            (0, vitest_1.expect)(output).toEqual(testCase.expOut);
        }
    });
});
function prettyJSON(obj) {
    if (obj === null) {
        return 'null';
    }
    if (obj === undefined) {
        return 'undefined';
    }
    return JSON.stringify(obj, Object.keys(obj).sort());
}
(0, vitest_1.describe)('getChatPanelTitle', () => {
    (0, vitest_1.test)('returns default title when no lastDisplayText', () => {
        const result = (0, chat_helpers_1.getChatPanelTitle)();
        (0, vitest_1.expect)(result).toEqual('New Chat');
    });
    (0, vitest_1.test)('long titles will be truncated', () => {
        const longTitle = 'This is a very long title that should get truncated by the function';
        const result = (0, chat_helpers_1.getChatPanelTitle)(longTitle);
        (0, vitest_1.expect)(result).toEqual('This is a very long title...');
    });
    (0, vitest_1.test)('keeps command key', () => {
        const title = '/explain this symbol';
        const result = (0, chat_helpers_1.getChatPanelTitle)(title);
        (0, vitest_1.expect)(result).toEqual('/explain this symbol');
    });
    (0, vitest_1.test)('keeps command key with file path', () => {
        const title = '/explain [_@a.ts_](a.ts)';
        const result = (0, chat_helpers_1.getChatPanelTitle)(title);
        (0, vitest_1.expect)(result).toEqual('/explain @a.ts');
    });
    (0, vitest_1.test)('removes markdown links', () => {
        const title = 'Summarize this file [_@a.ts_](a.ts)';
        const result = (0, chat_helpers_1.getChatPanelTitle)(title);
        (0, vitest_1.expect)(result).toEqual('Summarize this file @a.ts');
    });
    (0, vitest_1.test)('removes multiple markdown links', () => {
        const title = '[_@a.py_](a.py) [_@b.py_](b.py) explain';
        const result = (0, chat_helpers_1.getChatPanelTitle)(title);
        (0, vitest_1.expect)(result).toEqual('@a.py @b.py explain');
    });
    (0, vitest_1.test)('truncates long title with multiple markdown links', () => {
        const title = 'Explain the relationship...';
        const result = (0, chat_helpers_1.getChatPanelTitle)(title);
        (0, vitest_1.expect)(result).toEqual('Explain the relationship....');
    });
});
