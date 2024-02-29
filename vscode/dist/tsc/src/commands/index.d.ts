import type { CodySidebarTreeItem } from '../services/treeViewItems';
export declare const CodyCommandMenuItems: ({
    key: string;
    description: string;
    prompt: string;
    icon: string;
    command: {
        command: string;
    };
    keybinding: string;
    mode: string;
    type: string;
} | {
    key: string;
    description: string;
    icon: string;
    command: {
        command: string;
    };
    keybinding: string;
    mode: string;
    type: string;
    prompt?: undefined;
} | {
    key: string;
    description: string;
    icon: string;
    command: {
        command: string;
    };
    keybinding: string;
    type: string;
    prompt?: undefined;
    mode?: undefined;
})[];
export declare function getCommandTreeItems(): CodySidebarTreeItem[];
//# sourceMappingURL=index.d.ts.map