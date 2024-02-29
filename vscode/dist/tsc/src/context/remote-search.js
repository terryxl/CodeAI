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
exports.RemoteSearch = exports.RepoInclusion = void 0;
const vscode = __importStar(require("vscode"));
const cody_shared_1 = require("@sourcegraph/cody-shared");
const repositoryHelpers_1 = require("../repository/repositoryHelpers");
var RepoInclusion;
(function (RepoInclusion) {
    RepoInclusion["Automatic"] = "auto";
    RepoInclusion["Manual"] = "manual";
})(RepoInclusion || (exports.RepoInclusion = RepoInclusion = {}));
class RemoteSearch {
    static MAX_REPO_COUNT = 10;
    statusChangedEmitter = new vscode.EventEmitter();
    // Repositories we are including automatically because of the workspace.
    reposAuto = new Map();
    // Repositories the user has added manually.
    reposManual = new Map();
    dispose() {
        this.statusChangedEmitter.dispose();
    }
    // #region ContextStatusProvider implementation.
    onDidChangeStatus(callback) {
        return this.statusChangedEmitter.event(callback);
    }
    get status() {
        return [...this.getRepoIdSet()].map(id => {
            const auto = this.reposAuto.get(id);
            const manual = this.reposManual.get(id);
            const displayName = auto?.displayName || manual?.displayName || '?';
            return {
                displayName,
                providers: [
                    {
                        kind: 'search',
                        type: 'remote',
                        state: 'ready',
                        id,
                        inclusion: auto ? 'auto' : 'manual',
                    },
                ],
            };
        });
    }
    // #endregion
    // Removes a manually included repository.
    removeRepo(repoId) {
        if (this.reposManual.delete(repoId)) {
            this.statusChangedEmitter.fire(this);
        }
    }
    // Sets the repos to search. RepoInclusion.Automatic is for repositories added
    // automatically based on the workspace; these are presented differently
    // and can't be removed by the user. RepoInclusion.Manual is for repositories
    // added manually by the user.
    setRepos(repos, inclusion) {
        const repoMap = new Map(repos.map(repo => [repo.id, { displayName: repo.name }]));
        switch (inclusion) {
            case RepoInclusion.Automatic: {
                this.reposAuto = repoMap;
                break;
            }
            case RepoInclusion.Manual: {
                this.reposManual = repoMap;
                break;
            }
        }
        this.statusChangedEmitter.fire(this);
    }
    getRepos(inclusion) {
        return [
            ...(inclusion === RepoInclusion.Automatic ? this.reposAuto : this.reposManual).entries(),
        ].map(([id, repo]) => ({ id, name: repo.displayName }));
    }
    // Gets the set of all repositories to search.
    getRepoIdSet() {
        return new Set([...this.reposAuto.keys(), ...this.reposManual.keys()]);
    }
    async query(query) {
        const result = await cody_shared_1.graphqlClient.contextSearch(this.getRepoIdSet(), query);
        if (result instanceof Error) {
            throw result;
        }
        return result || [];
    }
    // IRemoteSearch implementation. This is only used for inline edit context.
    async setWorkspaceUri(uri) {
        const codebase = (0, repositoryHelpers_1.getCodebaseFromWorkspaceUri)(uri);
        if (!codebase) {
            this.setRepos([], RepoInclusion.Automatic);
            return;
        }
        const repos = await cody_shared_1.graphqlClient.getRepoIds([codebase], 10);
        if ((0, cody_shared_1.isError)(repos)) {
            throw repos;
        }
        this.setRepos(repos, RepoInclusion.Automatic);
    }
    async search(query) {
        const results = await this.query(query);
        if ((0, cody_shared_1.isError)(results)) {
            throw results;
        }
        return (results || []).map(result => ({
            type: 'file',
            uri: result.uri,
            repoName: result.repoName,
            revision: result.commit,
            source: 'unified',
            content: result.content,
            range: {
                start: {
                    line: result.startLine,
                    character: 0,
                },
                end: {
                    line: result.endLine,
                    character: 0,
                },
            },
        }));
    }
}
exports.RemoteSearch = RemoteSearch;
