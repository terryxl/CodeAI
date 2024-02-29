/// <reference path="../../../../src/fileUri.d.ts" />
import type { Memento } from 'vscode';
import type { UserLocalHistory } from '@sourcegraph/cody-shared';
import { type AuthStatus } from '../chat/protocol';
declare class LocalStorage {
    protected readonly KEY_LOCAL_HISTORY = "cody-local-chatHistory-v2";
    readonly ANONYMOUS_USER_ID_KEY = "sourcegraphAnonymousUid";
    readonly LAST_USED_ENDPOINT = "SOURCEGRAPH_CODY_ENDPOINT";
    protected readonly CODY_ENDPOINT_HISTORY = "SOURCEGRAPH_CODY_ENDPOINT_HISTORY";
    protected readonly KEY_LAST_USED_RECIPES = "SOURCEGRAPH_CODY_LAST_USED_RECIPE_NAMES";
    /**
     * Should be set on extension activation via `localStorage.setStorage(context.globalState)`
     * Done to avoid passing the local storage around as a parameter and instead
     * access it as a singleton via the module import.
     */
    private _storage;
    private get storage();
    setStorage(storage: Memento): void;
    getEndpoint(): string | null;
    saveEndpoint(endpoint: string): Promise<void>;
    deleteEndpoint(): Promise<void>;
    getEndpointHistory(): string[] | null;
    deleteEndpointHistory(): Promise<void>;
    private addEndpointHistory;
    getChatHistory(authStatus: AuthStatus): UserLocalHistory;
    setChatHistory(authStatus: AuthStatus, history: UserLocalHistory): Promise<void>;
    deleteChatHistory(authStatus: AuthStatus, chatID: string): Promise<void>;
    removeChatHistory(authStatus: AuthStatus): Promise<void>;
    /**
     * Return the anonymous user ID stored in local storage or create one if none exists (which
     * occurs on a fresh installation).
     */
    anonymousUserID(): Promise<{
        anonymousUserID: string;
        created: boolean;
    }>;
    setLastUsedCommands(commands: string[]): Promise<void>;
    getLastUsedCommands(): string[] | null;
    get(key: string): string | null;
    set(key: string, value: string): Promise<void>;
    delete(key: string): Promise<void>;
    /**
     * In https://github.com/sourcegraph/cody/pull/2665 we migrated the chat history key to use the
     * user's username instead of their email address. This means that the storage would retain the chat
     * history under the old key indefinitely. Large storage data slows down extension host activation
     * and each `Memento#update` call, so we don't want it to linger.
     */
    private migrateChatHistory2665;
}
/**
 * Singleton instance of the local storage provider.
 * The underlying storage is set on extension activation via `localStorage.setStorage(context.globalState)`.
 */
export declare const localStorage: LocalStorage;
export {};
//# sourceMappingURL=LocalStorageProvider.d.ts.map