"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatRateLimitPro = exports.ChatRateLimitFree = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("@vscode/webview-ui-toolkit/react");
const classnames_1 = __importDefault(require("classnames"));
const cody_shared_1 = require("@sourcegraph/cody-shared");
const ErrorItem_1 = require("@sourcegraph/cody-ui/src/chat/ErrorItem");
const VSCodeStoryDecorator_1 = require("./storybook/VSCodeStoryDecorator");
const TranscriptItem_module_css_1 = __importDefault(require("../../lib/ui/src/chat/TranscriptItem.module.css"));
const Chat_module_css_1 = __importDefault(require("./Chat.module.css"));
const meta = {
    title: 'cody/Chat Error Item',
    component: ErrorItem_1.ErrorItem,
    decorators: [VSCodeStoryDecorator_1.VSCodeStoryDecorator],
    parameters: {
        backgrounds: {
            default: 'vscode',
            values: [
                {
                    name: 'vscode',
                    value: 'var(--vscode-sideBar-background)',
                },
            ],
        },
    },
    render: args => ((0, jsx_runtime_1.jsx)("div", { className: (0, classnames_1.default)(TranscriptItem_module_css_1.default.row, Chat_module_css_1.default.transcriptItem, TranscriptItem_module_css_1.default.assistantRow), style: { border: '1px solid var(--vscode-sideBarSectionHeader-border)' }, children: (0, jsx_runtime_1.jsx)(ErrorItem_1.ErrorItem, { ...args }) })),
};
exports.default = meta;
const ChatButton = ({ label, action, onClick, appearance, }) => ((0, jsx_runtime_1.jsx)(react_1.VSCodeButton, { type: "button", onClick: () => onClick(action), className: Chat_module_css_1.default.chatButton, appearance: appearance, children: label }));
exports.ChatRateLimitFree = {
    args: {
        error: new cody_shared_1.RateLimitError('chat messages and commands', 'thing', true, 20, String(60 * 60 * 24 * 25)), // 25 days
        postMessage: () => { },
        userInfo: {
            isDotComUser: true,
            isCodyProUser: false,
        },
        ChatButtonComponent: ChatButton,
    },
};
exports.ChatRateLimitPro = {
    args: {
        error: new cody_shared_1.RateLimitError('chat messages and commands', 'thing', false, 500, String(60 * 60 * 24 * 5)), // 5 days
        postMessage: () => { },
        userInfo: {
            isDotComUser: true,
            isCodyProUser: true,
        },
        ChatButtonComponent: ChatButton,
    },
};
