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
exports.WorkspaceRepoMapper = void 0;
const cody_shared_1 = require("@sourcegraph/cody-shared");
const vscode = __importStar(require("vscode"));
const repositoryHelpers_1 = require("../repository/repositoryHelpers");
const remote_search_1 = require("./remote-search");
// TODO(dpc): The vscode.git extension has an delay before we can fetch a
// workspace folder's remote. Switch to cody-engine instead of depending on
// vscode.git and this arbitrary delay.
const GIT_REFRESH_DELAY = 2000;
// Watches the VSCode workspace roots and maps any it finds to remote repository
// IDs. This depends on the vscode.git extension for mapping git repositories
// to their remotes.
class WorkspaceRepoMapper {
    changeEmitter = new vscode.EventEmitter();
    disposables = [this.changeEmitter];
    repos = [];
    started;
    dispose() {
        vscode.Disposable.from(...this.disposables).dispose();
        this.disposables = [];
    }
    clientConfigurationDidChange() {
        if (this.started) {
            this.started.then(() => this.updateRepos());
        }
    }
    // CodebaseRepoIdMapper implementation.
    async repoForCodebase(repoName) {
        if (!repoName) {
            return;
        }
        // Check cached repository list.
        const item = this.repos.find(item => item.name === repoName);
        if (item) {
            return {
                id: item.id,
                name: item.name,
            };
        }
        const result = await cody_shared_1.graphqlClient.getRepoId(repoName);
        if ((0, cody_shared_1.isError)(result)) {
            throw result;
        }
        if (!result) {
            return;
        }
        return {
            name: repoName,
            id: result,
        };
    }
    // Fetches the set of repo IDs and starts listening for workspace changes.
    // After this Promise resolves, `workspaceRepoIds` contains the set of
    // repo IDs for the workspace (if any.)
    async start() {
        // If are already starting/started, then join that.
        if (this.started) {
            return this.started;
        }
        this.started = (async () => {
            try {
                await this.updateRepos();
            }
            catch (error) {
                // Reset the started property so the next call to start will try again.
                this.started = undefined;
                throw error;
            }
            vscode.workspace.onDidChangeWorkspaceFolders(async () => {
                (0, cody_shared_1.logDebug)('WorkspaceRepoMapper', 'Workspace folders changed, updating repos');
                setTimeout(async () => await this.updateRepos(), GIT_REFRESH_DELAY);
            }, undefined, this.disposables);
            (0, repositoryHelpers_1.gitAPI)()?.onDidOpenRepository(async () => {
                (0, cody_shared_1.logDebug)('WorkspaceRepoMapper', 'vscode.git repositories changed, updating repos');
                setTimeout(async () => await this.updateRepos(), GIT_REFRESH_DELAY);
            }, undefined, this.disposables);
        })();
        return this.started;
    }
    get workspaceRepos() {
        return [...this.repos];
    }
    get onChange() {
        return this.changeEmitter.event;
    }
    // Updates the `workspaceRepos` property and fires the change event.
    async updateRepos() {
        try {
            const folders = vscode.workspace.workspaceFolders || [];
            (0, cody_shared_1.logDebug)('WorkspaceRepoMapper', `Mapping ${folders.length} workspace folders to repos: ${folders
                .map(f => f.uri.toString())
                .join()}`);
            this.repos = await this.findRepoIds(folders);
        }
        catch (error) {
            (0, cody_shared_1.logDebug)('WorkspaceRepoMapper', `Error mapping workspace folders to repo IDs: ${error}`);
            throw error;
        }
        this.changeEmitter.fire(this.workspaceRepos);
    }
    // Given a set of workspace folders, looks up their git remotes and finds the related repo IDs,
    // if any.
    async findRepoIds(folders) {
        const repoNames = new Set(folders.flatMap(folder => {
            const codebase = (0, repositoryHelpers_1.getCodebaseFromWorkspaceUri)(folder.uri);
            return codebase ? [codebase] : [];
        }));
        if (repoNames.size === 0) {
            // Otherwise we fetch the first 10 repos from the Sourcegraph instance
            return [];
        }
        const ids = await cody_shared_1.graphqlClient.getRepoIds([...repoNames.values()], remote_search_1.RemoteSearch.MAX_REPO_COUNT);
        if ((0, cody_shared_1.isError)(ids)) {
            throw ids;
        }
        return ids;
    }
}
exports.WorkspaceRepoMapper = WorkspaceRepoMapper;
