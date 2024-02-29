/// <reference path="../../../../src/fileUri.d.ts" />
import * as vscode from 'vscode';
export declare function getAccessToken(): Promise<string | null>;
interface SecretStorage {
    get(key: string): Promise<string | undefined>;
    store(key: string, value: string): Promise<void>;
    storeToken(endpoint: string, value: string): Promise<void>;
    deleteToken(endpoint: string): Promise<void>;
    delete(key: string): Promise<void>;
    onDidChange(callback: (key: string) => Promise<void>): vscode.Disposable;
}
export declare class VSCodeSecretStorage implements SecretStorage {
    private fsPath;
    /**
     * Should be set on extension activation via `secretStorage.setStorage(context.secrets)`
     * Done to avoid passing the secret storage around as a parameter and instead
     * access it as a singleton via the module import.
     */
    private _secretStorage;
    private get secretStorage();
    setStorage(secretStorage: vscode.SecretStorage): void;
    constructor();
    get(key: string): Promise<string | undefined>;
    private getFromFsPath;
    store(key: string, value: string): Promise<void>;
    storeToken(endpoint: string, value: string): Promise<void>;
    deleteToken(endpoint: string): Promise<void>;
    delete(key: string): Promise<void>;
    onDidChange(callback: (key: string) => Promise<void>): vscode.Disposable;
}
declare class InMemorySecretStorage implements SecretStorage {
    private storage;
    private callbacks;
    constructor();
    get(key: string): Promise<string | undefined>;
    store(key: string, value: string): Promise<void>;
    storeToken(endpoint: string, value: string): Promise<void>;
    deleteToken(endpoint: string): Promise<void>;
    delete(key: string): Promise<void>;
    onDidChange(callback: (key: string) => Promise<void>): vscode.Disposable;
}
/**
 * Singleton instance of the secret storage provider.
 * The underlying storage is set on extension activation via `secretStorage.setStorage(context.secrets)`.
 */
export declare const secretStorage: InMemorySecretStorage | VSCodeSecretStorage;
export {};
//# sourceMappingURL=SecretStorageProvider.d.ts.map