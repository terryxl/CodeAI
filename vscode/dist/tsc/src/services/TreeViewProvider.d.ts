/// <reference path="../../../../src/fileUri.d.ts" />
import * as vscode from 'vscode';
import { type FeatureFlagProvider } from '@sourcegraph/cody-shared';
import type { AuthStatus } from '../chat/protocol';
import { type CodySidebarTreeItem, type CodyTreeItemType } from './treeViewItems';
export declare class ChatTreeItem extends vscode.TreeItem {
    readonly id: string;
    children: ChatTreeItem[] | undefined;
    constructor(id: string, title: string, icon?: string, command?: {
        command: string;
        args?: string[] | {
            [key: string]: string;
        }[];
    }, contextValue?: string, collapsibleState?: vscode.TreeItemCollapsibleState, children?: ChatTreeItem[]);
    loadChildNodes(): Promise<ChatTreeItem[] | undefined>;
}
export declare class TreeViewProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
    private type;
    private readonly featureFlagProvider;
    private treeNodes;
    private _disposables;
    private _onDidChangeTreeData;
    readonly onDidChangeTreeData: vscode.Event<vscode.TreeItem>;
    private authStatus;
    private treeItems;
    revivedChatItems: string[];
    constructor(type: CodyTreeItemType, featureFlagProvider: FeatureFlagProvider);
    /**
     * Gets the parent tree item for the given tree item.
     * @param treeItem - The tree item to get the parent for.
     * @returns The parent tree item, or undefined if the given item is a root item.
     */
    getParent(treeItem: vscode.TreeItem): vscode.TreeItem | undefined;
    /**
     * Updates the tree view with the provided tree items, filtering out any
     * that do not meet the required criteria to show.
     */
    updateTree(authStatus: AuthStatus, treeItems?: CodySidebarTreeItem[]): Promise<void>;
    /**
     * Refreshes the visible tree items, filtering out any
     * that do not meet the required criteria to show.
     */
    refresh(): Promise<void>;
    /**
     * Method to initialize the grouped chats for the History items
     */
    private initializeGroupedChats;
    syncAuthStatus(authStatus: AuthStatus): void;
    /**
     * Get parents items first
     * Then returns children items for each parent item
     */
    getChildren(element?: ChatTreeItem): Promise<ChatTreeItem[]>;
    /**
     * Get individual tree item
     */
    getTreeItem(treeItem: vscode.TreeItem): vscode.TreeItem;
    /**
     * Get individual tree item by chatID
     */
    getTreeItemByID(chatID: string): vscode.TreeItem | undefined;
    /**
     * Empty the tree view
     */
    reset(): void;
    /**
     * Dispose the disposables
     */
    dispose(): void;
}
//# sourceMappingURL=TreeViewProvider.d.ts.map