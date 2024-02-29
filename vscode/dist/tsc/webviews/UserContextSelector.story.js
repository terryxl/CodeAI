"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SymbolSearchMatches = exports.SymbolSearchNoMatchesWarning = exports.FileSearchMatches = exports.FileSearchNoMatches = exports.FileSearchEmpty = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const vscode_uri_1 = require("vscode-uri");
const VSCodeStoryDecorator_1 = require("./storybook/VSCodeStoryDecorator");
const UserContextSelector_1 = require("./UserContextSelector");
const meta = {
    title: 'cody/User Context Selector',
    component: UserContextSelector_1.UserContextSelectorComponent,
    decorators: [
        VSCodeStoryDecorator_1.VSCodeStoryDecorator,
        Story => {
            return ((0, jsx_runtime_1.jsx)("div", { style: { position: 'absolute', bottom: 0 }, children: (0, jsx_runtime_1.jsx)(Story, {}) }));
        },
    ],
    argTypes: {
        onSelected: { action: 'selected' },
        setSelectedChatContext: { action: 'setSelectedChatContext' },
    },
};
exports.default = meta;
exports.FileSearchEmpty = {
    args: {
        contextSelection: undefined,
        selected: 0,
        formInput: '@',
    },
};
exports.FileSearchNoMatches = {
    args: {
        contextSelection: [],
        selected: 0,
        formInput: '@missing',
    },
};
exports.FileSearchMatches = {
    args: {
        // Long enough to test text-overflow
        contextSelection: Array.from(new Array(20).keys()).map(i => ({
            uri: vscode_uri_1.URI.file(`${i ? `${'sub-dir/'.repeat(i * 5)}/` : ''}file-${i}.py`),
            type: 'file',
        })),
        selected: 0,
        formInput: '@file',
    },
};
exports.SymbolSearchNoMatchesWarning = {
    args: {
        contextSelection: [],
        selected: 0,
        formInput: '@#a',
    },
};
exports.SymbolSearchMatches = {
    args: {
        contextSelection: [
            {
                symbolName: 'LoginDialog',
                type: 'symbol',
                kind: 'class',
                uri: vscode_uri_1.URI.file('/lib/src/LoginDialog.tsx'),
            },
            {
                symbolName: 'login',
                type: 'symbol',
                kind: 'function',
                uri: vscode_uri_1.URI.file('/src/login.go'),
                range: { start: { line: 42, character: 1 }, end: { line: 44, character: 1 } },
            },
            {
                symbolName: 'handleLogin',
                type: 'symbol',
                kind: 'method',
                uri: vscode_uri_1.URI.file(`/${'sub-dir/'.repeat(50)}/}/src/LoginDialog.tsx`),
            },
            {
                symbolName: 'handleLogin',
                type: 'symbol',
                kind: 'method',
                uri: vscode_uri_1.URI.file(`/${'sub-dir/'.repeat(50)}/}/src/LoginDialog.tsx`),
            },
            {
                symbolName: 'handleLogin',
                type: 'symbol',
                kind: 'method',
                uri: vscode_uri_1.URI.file(`/${'sub-dir/'.repeat(50)}/}/src/LoginDialog.tsx`),
            },
            {
                symbolName: 'handleLogin',
                type: 'symbol',
                kind: 'method',
                uri: vscode_uri_1.URI.file(`/${'sub-dir/'.repeat(50)}/}/src/LoginDialog.tsx`),
            },
            {
                symbolName: 'handleLogin',
                type: 'symbol',
                kind: 'method',
                uri: vscode_uri_1.URI.file(`/${'sub-dir/'.repeat(50)}/}/src/LoginDialog.tsx`),
            },
        ],
        selected: 0,
        formInput: '@#login',
    },
};
