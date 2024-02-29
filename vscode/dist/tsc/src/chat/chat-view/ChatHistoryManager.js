"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatHistory = exports.ChatHistoryManager = void 0;
const LocalStorageProvider_1 = require("../../services/LocalStorageProvider");
class ChatHistoryManager {
    getLocalHistory(authStatus) {
        return LocalStorageProvider_1.localStorage.getChatHistory(authStatus);
    }
    getChat(authStatus, sessionID) {
        const chatHistory = this.getLocalHistory(authStatus);
        return chatHistory?.chat ? chatHistory.chat[sessionID] : null;
    }
    async saveChat(authStatus, chat, input) {
        const history = LocalStorageProvider_1.localStorage.getChatHistory(authStatus);
        history.chat[chat.id] = chat;
        if (input) {
            history.input.push(input);
        }
        await LocalStorageProvider_1.localStorage.setChatHistory(authStatus, history);
        return history;
    }
    async deleteChat(authStatus, chatID) {
        await LocalStorageProvider_1.localStorage.deleteChatHistory(authStatus, chatID);
    }
    // Remove chat history and input history
    async clear(authStatus) {
        await LocalStorageProvider_1.localStorage.removeChatHistory(authStatus);
    }
}
exports.ChatHistoryManager = ChatHistoryManager;
exports.chatHistory = new ChatHistoryManager();
