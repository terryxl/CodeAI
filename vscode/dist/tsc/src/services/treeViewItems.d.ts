import type { FeatureFlag } from "@sourcegraph/cody-shared";
export type CodyTreeItemType = "command" | "support" | "search" | "chat";
export interface CodySidebarTreeItem {
    title: string;
    icon: string;
    id?: string;
    description?: string;
    command: {
        command: string;
        args?: string[] | {
            [key: string]: string;
        }[];
    };
    show?: boolean;
    isNestedItem?: boolean;
    requireFeature?: FeatureFlag;
    requireUpgradeAvailable?: boolean;
    requireDotCom?: boolean;
}
/**
 * Gets the tree view items to display based on the provided type.
 */
export declare function getCodyTreeItems(type: CodyTreeItemType): CodySidebarTreeItem[];
//# sourceMappingURL=treeViewItems.d.ts.map