"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FreeUser = void 0;
const cody_shared_1 = require("@sourcegraph/cody-shared");
const VSCodeStoryDecorator_1 = require("../storybook/VSCodeStoryDecorator");
const ChatModelDropdownMenu_1 = require("./ChatModelDropdownMenu");
const types_1 = require("@sourcegraph/cody-shared/src/models/types");
const meta = {
    title: 'cody/Chat Model Dropdown',
    component: ChatModelDropdownMenu_1.ChatModelDropdownMenu,
    decorators: [VSCodeStoryDecorator_1.VSCodeStoryDecorator],
    args: {
        models: cody_shared_1.ModelProvider.get(types_1.ModelUsage.Chat, String(cody_shared_1.DOTCOM_URL)),
        disabled: false,
    },
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
};
exports.default = meta;
exports.FreeUser = {
    args: {
        userInfo: {
            isDotComUser: true,
            isCodyProUser: false,
        },
    },
};
