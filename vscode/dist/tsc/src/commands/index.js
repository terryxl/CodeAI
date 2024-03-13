"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCommandTreeItems = exports.CodyCommandMenuItems = void 0;
const platform_1 = require("@sourcegraph/cody-shared/src/common/platform");
const osIcon = (0, platform_1.isMac)() ? "⌥" : "Alt+";
exports.CodyCommandMenuItems = [
    {
        key: "ask",
        description: "对话",
        prompt: "Start a new chat",
        icon: "comment",
        command: { command: "cody.chat.panel.new" },
        keybinding: `${osIcon}L`,
        mode: "ask",
        type: "default",
    },
    {
        key: "edit",
        description: "编辑代码",
        prompt: "Start a code edit",
        icon: "wand",
        command: { command: "cody.command.edit-code" },
        keybinding: `${osIcon}K`,
        mode: "edit",
        type: "default",
        show: false,
    },
    // {
    //     key: 'doc',
    //     description: '代码文档',
    //     icon: 'book',
    //     command: { command: 'cody.command.document-code' },
    //     keybinding: '',
    //     mode: 'edit',
    //     type: 'default',
    // },
    {
        key: "explain",
        description: "代码解释",
        icon: "file-binary",
        command: { command: "cody.command.explain-code" },
        keybinding: "",
        mode: "ask",
        type: "default",
    },
    {
        key: "smell",
        description: "代码优化",
        icon: "checklist",
        command: { command: "cody.command.smell-code" },
        keybinding: "",
        mode: "ask",
        type: "default",
    },
    {
        key: "test",
        description: "生成单元测试",
        icon: "package",
        command: { command: "cody.command.unit-tests" },
        keybinding: "",
        mode: "edit",
        type: "default",
        show: false,
    },
    // {
    //     key: 'custom',
    //     description: '自定义命令',
    //     icon: 'tools',
    //     command: { command: 'cody.menu.custom-commands' },
    //     keybinding: `${osIcon}⇧C`,
    //     type: 'default',
    // },
];
function getCommandTreeItems() {
    return exports.CodyCommandMenuItems.map((item) => {
        return {
            ...item,
            title: item.description,
            description: item.keybinding,
        };
    });
}
exports.getCommandTreeItems = getCommandTreeItems;
