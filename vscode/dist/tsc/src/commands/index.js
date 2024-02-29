"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCommandTreeItems = exports.CodyCommandMenuItems = void 0;
const platform_1 = require("@sourcegraph/cody-shared/src/common/platform");
const osIcon = (0, platform_1.isMac)() ? '⌥' : 'Alt+';
exports.CodyCommandMenuItems = [
    {
        key: 'ask',
        description: '聊天',
        prompt: 'Start a new chat',
        icon: 'comment',
        command: { command: 'cody.chat.panel.new' },
        keybinding: `${osIcon}L`,
        mode: 'ask',
        type: 'default',
    },
    {
        key: 'edit',
        description: 'Edit Code',
        prompt: 'Start a code edit',
        icon: 'wand',
        command: { command: 'cody.command.edit-code' },
        keybinding: `${osIcon}K`,
        mode: 'edit',
        type: 'default',
    },
    {
        key: 'doc',
        description: 'Document Code',
        icon: 'book',
        command: { command: 'cody.command.document-code' },
        keybinding: '',
        mode: 'edit',
        type: 'default',
    },
    {
        key: 'explain',
        description: 'Explain Code',
        icon: 'file-binary',
        command: { command: 'cody.command.explain-code' },
        keybinding: '',
        mode: 'ask',
        type: 'default',
    },
    {
        key: 'test',
        description: 'Generate Unit Tests',
        icon: 'package',
        command: { command: 'cody.command.unit-tests' },
        keybinding: '',
        mode: 'edit',
        type: 'default',
    },
    {
        key: 'smell',
        description: 'Find Code Smells',
        icon: 'checklist',
        command: { command: 'cody.command.smell-code' },
        keybinding: '',
        mode: 'ask',
        type: 'default',
    },
    {
        key: 'custom',
        description: 'Custom Commands',
        icon: 'tools',
        command: { command: 'cody.menu.custom-commands' },
        keybinding: `${osIcon}⇧C`,
        type: 'default',
    },
];
function getCommandTreeItems() {
    return exports.CodyCommandMenuItems.map(item => {
        return {
            ...item,
            title: item.description,
            description: item.keybinding,
        };
    });
}
exports.getCommandTreeItems = getCommandTreeItems;
