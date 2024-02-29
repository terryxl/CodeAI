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
exports.CodebaseStatusProvider = void 0;
const lodash_1 = require("lodash");
const vscode = __importStar(require("vscode"));
const cody_shared_1 = require("@sourcegraph/cody-shared");
const configuration_1 = require("../../configuration");
const active_editor_1 = require("../../editor/active-editor");
const repositoryHelpers_1 = require("../../repository/repositoryHelpers");
/**
 * Provides and signals updates to the current codebase identifiers to use in the chat panel.
 */
class CodebaseStatusProvider {
    editor;
    symf;
    codebaseRepoIdMapper;
    disposables = [];
    eventEmitter = new vscode.EventEmitter();
    // undefined means uninitialized, null means there is no current codebase
    _currentCodebase = undefined;
    // undefined means symf is not active or there is no current codebase
    symfIndexStatus;
    constructor(editor, symf, codebaseRepoIdMapper) {
        this.editor = editor;
        this.symf = symf;
        this.codebaseRepoIdMapper = codebaseRepoIdMapper;
        this.disposables.push(vscode.window.onDidChangeActiveTextEditor(() => this.updateStatus()), vscode.workspace.onDidChangeWorkspaceFolders(() => this.updateStatus()), vscode.workspace.onDidChangeConfiguration(e => {
            if (e.affectsConfiguration('cody.codebase')) {
                return this.updateStatus();
            }
            return Promise.resolve();
        }), this.eventEmitter);
        if (this.symf) {
            this.disposables.push(this.symf.onIndexStart(() => {
                void this.updateStatus();
            }), this.symf.onIndexEnd(() => {
                void this.updateStatus();
            }));
        }
    }
    dispose() {
        for (const d of this.disposables) {
            d.dispose();
        }
        this.disposables = [];
    }
    onDidChangeStatus(callback) {
        return this.eventEmitter.event(callback);
    }
    get status() {
        if (this._currentCodebase === undefined) {
            void this.updateStatus();
            return [];
        }
        const codebase = this._currentCodebase;
        if (!codebase) {
            return [];
        }
        const providers = [];
        providers.push(...this.getSymfIndexStatus());
        if (providers.length === 0) {
            return [];
        }
        return [
            {
                dir: codebase.localFolder,
                displayName: (0, cody_shared_1.uriBasename)(codebase.localFolder),
                providers,
            },
        ];
    }
    getSymfIndexStatus() {
        if (!this.symf || !this._currentCodebase || !this.symfIndexStatus) {
            return [];
        }
        return [
            {
                kind: 'search',
                type: 'local',
                state: this.symfIndexStatus || 'unindexed',
            },
        ];
    }
    async currentCodebase() {
        if (this._currentCodebase === undefined) {
            // lazy initialization
            await this.updateStatus();
        }
        return this._currentCodebase || null;
    }
    async updateStatus() {
        const didCodebaseChange = await this._updateCodebase_NoFire();
        const didSymfStatusChange = await this._updateSymfStatus_NoFire();
        if (didCodebaseChange || didSymfStatusChange) {
            this.eventEmitter.fire(this);
        }
    }
    async _updateCodebase_NoFire() {
        const workspaceRoot = this.editor.getWorkspaceRootUri();
        const config = (0, configuration_1.getConfiguration)();
        if (this._currentCodebase !== undefined &&
            workspaceRoot?.toString() === this._currentCodebase?.localFolder.toString() &&
            config.codebase === this._currentCodebase?.setting &&
            this._currentCodebase?.remoteRepoId) {
            // do nothing if local codebase identifier is unchanged and we have a remote repo ID
            return Promise.resolve(false);
        }
        let newCodebase = null;
        if (workspaceRoot) {
            newCodebase = { localFolder: workspaceRoot, setting: config.codebase };
            const currentFile = (0, active_editor_1.getEditor)()?.active?.document?.uri;
            // Get codebase from config or fallback to getting codebase name from current file URL
            // Always use the codebase from config as this is manually set by the user
            newCodebase.remote =
                config.codebase ||
                    (currentFile ? (0, repositoryHelpers_1.getCodebaseFromWorkspaceUri)(currentFile) : config.codebase);
            if (newCodebase.remote) {
                newCodebase.remoteRepoId = (await this.codebaseRepoIdMapper?.repoForCodebase(newCodebase.remote))?.id;
            }
        }
        const didCodebaseChange = !(0, lodash_1.isEqual)(this._currentCodebase, newCodebase);
        this._currentCodebase = newCodebase;
        return Promise.resolve(didCodebaseChange);
    }
    async _updateSymfStatus_NoFire() {
        if (!this.symf) {
            return false;
        }
        const newSymfStatus = this._currentCodebase?.localFolder && (0, cody_shared_1.isFileURI)(this._currentCodebase.localFolder)
            ? await this.symf.getIndexStatus(this._currentCodebase.localFolder)
            : undefined;
        const didSymfStatusChange = this.symfIndexStatus !== newSymfStatus;
        this.symfIndexStatus = newSymfStatus;
        return didSymfStatusChange;
    }
}
exports.CodebaseStatusProvider = CodebaseStatusProvider;
