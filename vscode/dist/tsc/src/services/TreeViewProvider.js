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
exports.TreeViewProvider = exports.ChatTreeItem = void 0;
const vscode = __importStar(require("vscode"));
const cody_shared_1 = require("@sourcegraph/cody-shared");
const HistoryChat_1 = require("./HistoryChat");
const treeViewItems_1 = require("./treeViewItems");
class ChatTreeItem extends vscode.TreeItem {
    id;
    children;
    constructor(id, title, icon, command, contextValue, collapsibleState = vscode.TreeItemCollapsibleState.None, children) {
        super(title, collapsibleState);
        this.id = id;
        this.id = id;
        if (icon) {
            this.iconPath = new vscode.ThemeIcon(icon);
        }
        if (command) {
            this.command = {
                command: command.command,
                title,
                arguments: command.args,
            };
        }
        if (contextValue) {
            this.contextValue = contextValue;
        }
        this.children = children;
    }
    async loadChildNodes() {
        await Promise.resolve();
        return this.children;
    }
}
exports.ChatTreeItem = ChatTreeItem;
class TreeViewProvider {
    type;
    featureFlagProvider;
    treeNodes = [];
    _disposables = [];
    _onDidChangeTreeData = new vscode.EventEmitter();
    onDidChangeTreeData = this._onDidChangeTreeData.event;
    authStatus;
    treeItems;
    revivedChatItems = [];
    constructor(type, featureFlagProvider) {
        this.type = type;
        this.featureFlagProvider = featureFlagProvider;
        this.treeItems = (0, treeViewItems_1.getCodyTreeItems)(type);
        this.treeItems = this.treeItems.filter(t => t.show !== false);
        void this.refresh();
    }
    /**
     * Gets the parent tree item for the given tree item.
     * @param treeItem - The tree item to get the parent for.
     * @returns The parent tree item, or undefined if the given item is a root item.
     */
    getParent(treeItem) {
        // Return undefine for root items
        if (!treeItem?.contextValue) {
            return undefined;
        }
        // TODO implement getParent method for non-root items
        return undefined;
    }
    /**
     * Updates the tree view with the provided tree items, filtering out any
     * that do not meet the required criteria to show.
     */
    async updateTree(authStatus, treeItems) {
        if (treeItems) {
            this.treeItems = treeItems;
        }
        this.authStatus = authStatus;
        return this.refresh();
    }
    /**
     * Refreshes the visible tree items, filtering out any
     * that do not meet the required criteria to show.
     */
    async refresh() {
        // TODO(dantup): This method can be made not-async again when we don't need to call evaluateFeatureFlag
        const updatedTree = [];
        this.treeNodes = updatedTree; // Set this before any awaits so last call here always wins regardless of async scheduling.
        for (const item of this.treeItems) {
            if (item.requireDotCom) {
                const isConnectedtoDotCom = this.authStatus?.endpoint && (0, cody_shared_1.isDotCom)(this.authStatus?.endpoint);
                if (!isConnectedtoDotCom) {
                    continue;
                }
            }
            if (item.requireFeature &&
                !(await this.featureFlagProvider.evaluateFeatureFlag(item.requireFeature))) {
                continue;
            }
            if (item.requireUpgradeAvailable && !(this.authStatus?.userCanUpgrade ?? false)) {
                continue;
            }
            const treeItem = new vscode.TreeItem({ label: item.title });
            treeItem.id = item.id;
            treeItem.iconPath = new vscode.ThemeIcon(item.icon);
            treeItem.description = item.description;
            treeItem.command = {
                command: item.command.command,
                title: item.title,
                arguments: item.command.args,
            };
            updatedTree.push(treeItem);
        }
        if (this.type === 'chat') {
            await this.initializeGroupedChats();
            void vscode.commands.executeCommand('setContext', 'cody.hasChatHistory', this.treeNodes.length);
        }
        this._onDidChangeTreeData.fire(undefined);
    }
    /**
     * Method to initialize the grouped chats for the History items
     */
    async initializeGroupedChats() {
        const groupedChats = (0, HistoryChat_1.groupCodyChats)(this.authStatus);
        if (!groupedChats) {
            return;
        }
        this.treeNodes = [];
        let firstGroup = true;
        // Create a ChatTreeItem for each group and add to treeNodes
        for (const [groupLabel, chats] of Object.entries(groupedChats)) {
            // only display the group in the treeview for which chat exists
            if (chats.length) {
                const collapsibleState = firstGroup || chats.some(chat => this.revivedChatItems.includes(chat.id))
                    ? vscode.TreeItemCollapsibleState.Expanded
                    : vscode.TreeItemCollapsibleState.Collapsed;
                const groupItem = new ChatTreeItem(groupLabel, groupLabel, undefined, undefined, undefined, collapsibleState, chats.map(chat => new ChatTreeItem(chat.id, chat.title, chat.icon, chat.command, 'cody.chats')));
                if (collapsibleState === vscode.TreeItemCollapsibleState.Expanded) {
                    this._onDidChangeTreeData.fire(groupItem);
                }
                this.treeNodes.push(groupItem);
                firstGroup = false;
            }
        }
        await Promise.resolve();
    }
    syncAuthStatus(authStatus) {
        this.authStatus = authStatus;
        void this.refresh();
    }
    /**
     * Get parents items first
     * Then returns children items for each parent item
     */
    async getChildren(element) {
        if (element) {
            // Load children if not already loaded
            if (!element.children) {
                await element.loadChildNodes();
            }
            return element.children || [];
        }
        return this.treeNodes;
    }
    /**
     * Get individual tree item
     */
    getTreeItem(treeItem) {
        return treeItem;
    }
    /**
     * Get individual tree item by chatID
     */
    getTreeItemByID(chatID) {
        return this.treeNodes.find(node => node.id === chatID);
    }
    /**
     * Empty the tree view
     */
    reset() {
        void vscode.commands.executeCommand('setContext', 'cody.hasChatHistory', false);
        this.treeNodes = [];
        void this.refresh();
    }
    /**
     * Dispose the disposables
     */
    dispose() {
        this.reset();
        for (const disposable of this._disposables) {
            disposable.dispose();
        }
        this._disposables = [];
    }
}
exports.TreeViewProvider = TreeViewProvider;
