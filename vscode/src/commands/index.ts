import type { CodySidebarTreeItem } from "../services/treeViewItems";
import { isMac } from "@sourcegraph/cody-shared/src/common/platform";

const osIcon = isMac() ? "⌥" : "Alt+";

export const CodyCommandMenuItems = [
    {
        key: "ask",
        description: "聊天",
        prompt: "Start a new chat",
        icon: "comment",
        command: { command: "cody.chat.panel.new" },
        keybinding: `${osIcon}L`,
        mode: "ask",
        type: "default",
        show: false,
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
        description: "解读代码",
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

export function getCommandTreeItems(): CodySidebarTreeItem[] {
    return CodyCommandMenuItems.map((item) => {
        return {
            ...item,
            title: item.description,
            description: item.keybinding,
        };
    });
}
