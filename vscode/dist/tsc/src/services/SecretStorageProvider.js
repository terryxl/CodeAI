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
exports.secretStorage = exports.VSCodeSecretStorage = exports.getAccessToken = void 0;
const vscode = __importStar(require("vscode"));
const log_1 = require("../log");
const CODY_ACCESS_TOKEN_SECRET = 'cody.access-token';
async function getAccessToken() {
    try {
        const token = (await exports.secretStorage.get(CODY_ACCESS_TOKEN_SECRET)) || null;
        if (token) {
            return token;
        }
        throw new Error('token not found');
    }
    catch (error) {
        (0, log_1.logError)('VSCodeSecretStorage:getAccessToken', 'failed', { verbose: error });
        // Remove corrupted token from secret storage
        await exports.secretStorage.delete(CODY_ACCESS_TOKEN_SECRET);
        return null;
    }
}
exports.getAccessToken = getAccessToken;
class VSCodeSecretStorage {
    fsPath = null;
    /**
     * Should be set on extension activation via `secretStorage.setStorage(context.secrets)`
     * Done to avoid passing the secret storage around as a parameter and instead
     * access it as a singleton via the module import.
     */
    _secretStorage = null;
    get secretStorage() {
        if (!this._secretStorage) {
            throw new Error('SecretStorage not initialized');
        }
        return this._secretStorage;
    }
    setStorage(secretStorage) {
        this._secretStorage = secretStorage;
    }
    constructor() {
        const config = vscode.workspace.getConfiguration('cody');
        // For user that does not have secret storage implemented in their server
        this.fsPath = config.get('experimental.localTokenPath') || null;
        if (this.fsPath) {
            (0, log_1.logDebug)('VSCodeSecretStorage:experimental.localTokenPath', 'enabled', {
                verbose: this.fsPath,
            });
        }
    }
    // Catch corrupted token in secret storage
    async get(key) {
        // If fsPath is provided, get token from fsPath instead of secret storage
        if (this.fsPath && this.fsPath?.length > 0) {
            return this.getFromFsPath(this.fsPath);
        }
        try {
            if (key) {
                return await this.secretStorage.get(key);
            }
        }
        catch (error) {
            console.error('Failed to get token from Secret Storage', error);
        }
        return undefined;
    }
    async getFromFsPath(fsPath) {
        return (await getAccessTokenFromFsPath(fsPath)) || undefined;
    }
    async store(key, value) {
        try {
            if (value?.length > 0) {
                await this.secretStorage.store(key, value);
            }
        }
        catch (error) {
            (0, log_1.logError)('VSCodeSecretStorage:store:failed', key, { verbose: error });
        }
    }
    async storeToken(endpoint, value) {
        if (!value || !endpoint) {
            return;
        }
        await this.store(endpoint, value);
        await this.store(CODY_ACCESS_TOKEN_SECRET, value);
    }
    async deleteToken(endpoint) {
        await this.secretStorage.delete(endpoint);
        await this.secretStorage.delete(CODY_ACCESS_TOKEN_SECRET);
    }
    async delete(key) {
        await this.secretStorage.delete(key);
    }
    onDidChange(callback) {
        return this.secretStorage.onDidChange(event => {
            // Run callback on token changes for current endpoint only
            if (event.key === CODY_ACCESS_TOKEN_SECRET) {
                return callback(event.key);
            }
            return;
        });
    }
}
exports.VSCodeSecretStorage = VSCodeSecretStorage;
class InMemorySecretStorage {
    storage;
    callbacks;
    constructor() {
        this.storage = new Map();
        this.callbacks = [];
    }
    async get(key) {
        return Promise.resolve(this.storage.get(key));
    }
    async store(key, value) {
        if (!value) {
            return;
        }
        this.storage.set(key, value);
        for (const cb of this.callbacks) {
            void cb(key);
        }
        return Promise.resolve();
    }
    async storeToken(endpoint, value) {
        await this.store(endpoint, value);
        await this.store(CODY_ACCESS_TOKEN_SECRET, value);
    }
    async deleteToken(endpoint) {
        await this.delete(endpoint);
        await this.delete(CODY_ACCESS_TOKEN_SECRET);
    }
    async delete(key) {
        this.storage.delete(key);
        for (const cb of this.callbacks) {
            void cb(key);
        }
        return Promise.resolve();
    }
    onDidChange(callback) {
        this.callbacks.push(callback);
        return new vscode.Disposable(() => {
            const callbackIndex = this.callbacks.indexOf(callback);
            this.callbacks.splice(callbackIndex, 1);
        });
    }
}
async function getAccessTokenFromFsPath(fsPath) {
    try {
        const fsPathUri = vscode.Uri.file(fsPath);
        const fileContent = await vscode.workspace.fs.readFile(fsPathUri);
        const decoded = new TextDecoder('utf-8').decode(fileContent);
        const json = JSON.parse(decoded);
        if (!json.token) {
            throw new Error(`Failed to retrieve token from: ${fsPath}`);
        }
        (0, log_1.logDebug)('VSCodeSecretStorage:getAccessTokenFromFsPath', 'retrieved');
        return json.token;
    }
    catch (error) {
        (0, log_1.logError)('VSCodeSecretStorage:getAccessTokenFromFsPath', 'failed', { verbose: error });
        return null;
    }
}
/**
 * Singleton instance of the secret storage provider.
 * The underlying storage is set on extension activation via `secretStorage.setStorage(context.secrets)`.
 */
exports.secretStorage = process.env.CODY_TESTING === 'true' || process.env.CODY_PROFILE_TEMP === 'true'
    ? new InMemorySecretStorage()
    : new VSCodeSecretStorage();
