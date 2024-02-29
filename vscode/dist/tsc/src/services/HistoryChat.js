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
exports.displayHistoryQuickPick = exports.groupCodyChats = void 0;
const vscode = __importStar(require("vscode"));
const chat_helpers_1 = require("../chat/chat-view/chat-helpers");
const ChatHistoryManager_1 = require("../chat/chat-view/ChatHistoryManager");
const dateEqual = (d1, d2) => {
    return d1.getDate() === d2.getDate() && monthYearEqual(d1, d2);
};
const monthYearEqual = (d1, d2) => {
    return d1.getMonth() === d2.getMonth() && d1.getFullYear() === d2.getFullYear();
};
function groupCodyChats(authStatus) {
    const todayChats = [];
    const yesterdayChats = [];
    const thisMonthChats = [];
    const lastMonthChats = [];
    const nMonthsChats = [];
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const lastMonth = new Date();
    lastMonth.setDate(0);
    const chatGroups = {
        Today: todayChats,
        Yesterday: yesterdayChats,
        'This month': thisMonthChats,
        'Last month': lastMonthChats,
        'N months ago': nMonthsChats,
    };
    if (!authStatus) {
        return null;
    }
    const chats = ChatHistoryManager_1.chatHistory.getLocalHistory(authStatus)?.chat;
    if (!chats) {
        return null;
    }
    const chatHistoryEntries = [...Object.entries(chats)];
    for (const [id, entry] of chatHistoryEntries) {
        let lastHumanMessage = undefined;
        // Can use Array.prototype.findLast once we drop Node 16
        for (let index = entry.interactions.length - 1; index >= 0; index--) {
            lastHumanMessage = entry.interactions[index]?.humanMessage;
            if (lastHumanMessage) {
                break;
            }
        }
        if (lastHumanMessage?.displayText && lastHumanMessage?.text) {
            const lastDisplayText = lastHumanMessage.displayText.split('\n')[0];
            const chatTitle = chats[id].chatTitle || (0, chat_helpers_1.getChatPanelTitle)(lastDisplayText, false);
            const lastInteractionTimestamp = new Date(entry.lastInteractionTimestamp);
            let groupLabel = 'N months ago';
            if (dateEqual(today, lastInteractionTimestamp)) {
                groupLabel = 'Today';
            }
            else if (dateEqual(yesterday, lastInteractionTimestamp)) {
                groupLabel = 'Yesterday';
            }
            else if (monthYearEqual(today, lastInteractionTimestamp)) {
                groupLabel = 'This month';
            }
            else if (monthYearEqual(lastMonth, lastInteractionTimestamp)) {
                groupLabel = 'Last month';
            }
            const chatGroup = chatGroups[groupLabel];
            chatGroup.push({
                id,
                title: chatTitle,
                icon: 'comment-discussion',
                command: {
                    command: 'cody.chat.panel.restore',
                    args: [id, chatTitle],
                },
            });
        }
    }
    return {
        Today: todayChats.reverse(),
        Yesterday: yesterdayChats.reverse(),
        'This month': thisMonthChats.reverse(),
        'Last month': lastMonthChats.reverse(),
        'N months ago': nMonthsChats.reverse(),
    };
}
exports.groupCodyChats = groupCodyChats;
async function displayHistoryQuickPick(authStatus) {
    const groupedChats = groupCodyChats(authStatus);
    if (!groupedChats) {
        return;
    }
    const quickPickItems = [];
    const addGroupSeparator = (groupName) => {
        quickPickItems.push({
            label: groupName,
            onSelect: async () => { },
            kind: vscode.QuickPickItemKind.Separator,
        });
    };
    for (const [groupName, chats] of Object.entries(groupedChats)) {
        if (chats.length > 0) {
            addGroupSeparator(groupName.toLowerCase());
            for (const chat of chats) {
                quickPickItems.push({
                    label: chat.title,
                    onSelect: async () => {
                        await vscode.commands.executeCommand('cody.chat.panel.restore', chat.id, chat.title);
                    },
                });
            }
        }
    }
    const selectedItem = await vscode.window.showQuickPick(quickPickItems, {
        placeHolder: 'Search chat history',
    });
    if (selectedItem?.onSelect) {
        await selectedItem.onSelect();
    }
}
exports.displayHistoryQuickPick = displayHistoryQuickPick;
