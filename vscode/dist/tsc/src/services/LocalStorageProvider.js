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
exports.localStorage = void 0;
const uuid = __importStar(require("uuid"));
const protocol_1 = require("../chat/protocol");
class LocalStorage {
    // Bump this on storage changes so we don't handle incorrectly formatted data
    KEY_LOCAL_HISTORY = 'cody-local-chatHistory-v2';
    ANONYMOUS_USER_ID_KEY = 'sourcegraphAnonymousUid';
    LAST_USED_ENDPOINT = 'SOURCEGRAPH_CODY_ENDPOINT';
    CODY_ENDPOINT_HISTORY = 'SOURCEGRAPH_CODY_ENDPOINT_HISTORY';
    KEY_LAST_USED_RECIPES = 'SOURCEGRAPH_CODY_LAST_USED_RECIPE_NAMES';
    /**
     * Should be set on extension activation via `localStorage.setStorage(context.globalState)`
     * Done to avoid passing the local storage around as a parameter and instead
     * access it as a singleton via the module import.
     */
    _storage = null;
    get storage() {
        if (!this._storage) {
            throw new Error('LocalStorage not initialized');
        }
        return this._storage;
    }
    setStorage(storage) {
        this._storage = storage;
    }
    getEndpoint() {
        const endpoint = this.storage.get(this.LAST_USED_ENDPOINT, null);
        // Clear last used endpoint if it is a Sourcegraph token
        if (endpoint && (0, protocol_1.isSourcegraphToken)(endpoint)) {
            this.deleteEndpoint();
            return null;
        }
        return endpoint;
    }
    async saveEndpoint(endpoint) {
        if (!endpoint) {
            return;
        }
        try {
            // Do not save sourcegraph tokens as the last used endpoint
            if ((0, protocol_1.isSourcegraphToken)(endpoint)) {
                return;
            }
            const uri = new URL(endpoint).href;
            await this.storage.update(this.LAST_USED_ENDPOINT, uri);
            await this.addEndpointHistory(uri);
        }
        catch (error) {
            console.error(error);
        }
    }
    async deleteEndpoint() {
        await this.storage.update(this.LAST_USED_ENDPOINT, null);
    }
    getEndpointHistory() {
        return this.storage.get(this.CODY_ENDPOINT_HISTORY, null);
    }
    async deleteEndpointHistory() {
        await this.storage.update(this.CODY_ENDPOINT_HISTORY, null);
    }
    async addEndpointHistory(endpoint) {
        // Do not save sourcegraph tokens as endpoint
        if ((0, protocol_1.isSourcegraphToken)(endpoint)) {
            return;
        }
        const history = this.storage.get(this.CODY_ENDPOINT_HISTORY, null);
        const historySet = new Set(history);
        historySet.delete(endpoint);
        historySet.add(endpoint);
        await this.storage.update(this.CODY_ENDPOINT_HISTORY, [...historySet]);
    }
    getChatHistory(authStatus) {
        let history = this.storage.get(this.KEY_LOCAL_HISTORY, null);
        if (!history) {
            return { chat: {}, input: [] };
        }
        const key = getKeyForAuthStatus(authStatus);
        // For backwards compatibility, we upgrade the local storage key from the old layout that is
        // not scoped to individual user accounts to be scoped instead.
        if (history && !isMigratedChatHistory2261(history)) {
            // HACK: We spread both parts here as TS would otherwise have issues validating the type
            //       of AccountKeyedChatHistory. This is only three fields though.
            history = {
                ...{ [key]: history },
                ...{
                    chat: {},
                    input: [],
                },
            };
            // We use a raw write here to ensure we do not _append_ a key but actually replace
            // existing `chat` and `input` keys.
            // The result is not awaited to avoid changing this API to be async.
            this.storage.update(this.KEY_LOCAL_HISTORY, history).then(() => { }, console.error);
        }
        if (!Object.hasOwn(history, key)) {
            return { chat: {}, input: [] };
        }
        const accountHistory = history[key];
        // Persisted history might contain only string inputs without context so these may need converting too.
        const inputs = accountHistory?.input;
        if (inputs?.length) {
            let didUpdate = false;
            for (let i = 0; i < inputs.length; i++) {
                const input = inputs[i];
                // Convert strings to ChatInputHistory
                if (typeof input === 'string') {
                    inputs[i] = { inputText: input, inputContextFiles: [] };
                    didUpdate = true;
                }
            }
            // Persist back to disk if we made any changes.
            if (didUpdate) {
                this.storage.update(this.KEY_LOCAL_HISTORY, history).then(() => { }, console.error);
            }
        }
        return accountHistory;
    }
    async setChatHistory(authStatus, history) {
        try {
            const key = getKeyForAuthStatus(authStatus);
            let fullHistory = this.storage.get(this.KEY_LOCAL_HISTORY, null);
            if (fullHistory) {
                fullHistory[key] = history;
            }
            else {
                fullHistory = {
                    [key]: history,
                };
            }
            await this.storage.update(this.KEY_LOCAL_HISTORY, fullHistory);
            // MIGRATION: Delete old/orphaned storage data from a previous migration.
            this.migrateChatHistory2665(fullHistory);
        }
        catch (error) {
            console.error(error);
        }
    }
    async deleteChatHistory(authStatus, chatID) {
        const userHistory = this.getChatHistory(authStatus);
        if (userHistory) {
            try {
                delete userHistory.chat[chatID];
                await this.setChatHistory(authStatus, userHistory);
            }
            catch (error) {
                console.error(error);
            }
        }
    }
    async removeChatHistory(authStatus) {
        try {
            await this.setChatHistory(authStatus, { chat: {}, input: [] });
        }
        catch (error) {
            console.error(error);
        }
    }
    /**
     * Return the anonymous user ID stored in local storage or create one if none exists (which
     * occurs on a fresh installation).
     */
    async anonymousUserID() {
        let id = this.storage.get(this.ANONYMOUS_USER_ID_KEY);
        let created = false;
        if (!id) {
            created = true;
            id = uuid.v4();
            try {
                await this.storage.update(this.ANONYMOUS_USER_ID_KEY, id);
            }
            catch (error) {
                console.error(error);
            }
        }
        return { anonymousUserID: id, created };
    }
    async setLastUsedCommands(commands) {
        if (commands.length === 0) {
            return;
        }
        try {
            await this.storage.update(this.KEY_LAST_USED_RECIPES, commands);
        }
        catch (error) {
            console.error(error);
        }
    }
    getLastUsedCommands() {
        return this.storage.get(this.KEY_LAST_USED_RECIPES, null);
    }
    get(key) {
        return this.storage.get(key, null);
    }
    async set(key, value) {
        try {
            await this.storage.update(key, value);
        }
        catch (error) {
            console.error(error);
        }
    }
    async delete(key) {
        await this.storage.update(key, undefined);
    }
    /**
     * In https://github.com/sourcegraph/cody/pull/2665 we migrated the chat history key to use the
     * user's username instead of their email address. This means that the storage would retain the chat
     * history under the old key indefinitely. Large storage data slows down extension host activation
     * and each `Memento#update` call, so we don't want it to linger.
     */
    migrateChatHistory2665(history) {
        const needsMigration = Object.keys(history).some(key => key.includes('@'));
        if (needsMigration) {
            const cleanedHistory = Object.fromEntries(Object.entries(history).filter(([key]) => !key.includes('@')));
            this.storage.update(this.KEY_LOCAL_HISTORY, cleanedHistory).then(() => { }, console.error);
        }
    }
}
/**
 * Singleton instance of the local storage provider.
 * The underlying storage is set on extension activation via `localStorage.setStorage(context.globalState)`.
 */
exports.localStorage = new LocalStorage();
function getKeyForAuthStatus(authStatus) {
    return `${authStatus.endpoint}-${authStatus.username}`;
}
/**
 * As part of #2261, we migrated the storage format of the chat history to be keyed by the current
 * user account. This checks if the new format is used by checking if any key contains a hyphen (the
 * separator between endpoint and email in the new format).
 */
function isMigratedChatHistory2261(history) {
    return !!Object.keys(history).find(k => k.includes('-'));
}
