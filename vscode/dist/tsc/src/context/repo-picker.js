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
exports.RemoteRepoPicker = void 0;
const vscode = __importStar(require("vscode"));
const log_1 = require("../log");
const remote_search_1 = require("./remote-search");
const repo_fetcher_1 = require("./repo-fetcher");
// A quickpick for choosing a set of repositories from a Sourcegraph instance.
class RemoteRepoPicker {
    fetcher;
    workspaceRepoMapper;
    maxSelectedRepoCount = remote_search_1.RemoteSearch.MAX_REPO_COUNT - 1;
    disposables = [];
    quickpick;
    prefetchedRepos = new Map();
    constructor(fetcher, workspaceRepoMapper) {
        this.fetcher = fetcher;
        this.workspaceRepoMapper = workspaceRepoMapper;
        this.fetcher.onRepoListChanged(() => this.handleRepoListChanged(), undefined, this.disposables);
        this.fetcher.onStateChanged(state => {
            this.quickpick.busy = state === repo_fetcher_1.RepoFetcherState.Fetching;
            if (state === repo_fetcher_1.RepoFetcherState.Errored) {
                void vscode.window.showErrorMessage(`Failed to fetch repository list: ${this.fetcher.lastError?.message}`);
            }
        }, undefined, this.disposables);
        this.quickpick = vscode.window.createQuickPick();
        this.quickpick.matchOnDetail = true;
        this.quickpick.canSelectMany = true;
        this.updateTitle();
        this.quickpick.onDidChangeSelection(selection => {
            if (selection.length === this.maxSelectedRepoCount + 1) {
                void vscode.window.showWarningMessage(`You can only select up to ${this.maxSelectedRepoCount} repositories.`);
            }
            this.updateTitle();
        }, undefined, this.disposables);
    }
    dispose() {
        vscode.Disposable.from(...this.disposables).dispose();
        this.disposables = [];
        this.quickpick.dispose();
    }
    updateTitle() {
        const remaining = this.maxSelectedRepoCount - this.quickpick.selectedItems.length;
        this.quickpick.placeholder =
            remaining === 0 ? 'Click OK to continue' : 'Type to search repositories...';
        if (remaining === 0) {
            this.quickpick.title = '✅ Choose repositories';
        }
        else if (remaining === 1) {
            this.quickpick.title = '✨ Choose the last repository';
        }
        else if (remaining > 0) {
            this.quickpick.title = `Choose up to ${remaining} more repositories`;
        }
        else {
            this.quickpick.title = `❌ Too many repositories selected: Uncheck ${-remaining} to continue`;
        }
    }
    // Gets a set of default repositories to search if none were specified.
    async getDefaultRepos() {
        await this.workspaceRepoMapper.start();
        // Take up to the first N repos from the workspace.
        return this.workspaceRepoMapper.workspaceRepos.slice(0, this.maxSelectedRepoCount);
    }
    // Shows the remote repo picker. Resolves with `undefined` if the user
    // dismissed the dialog with ESC, a click away, etc.
    show(selection) {
        (0, log_1.logDebug)('RepoPicker', 'showing; fetcher state =', this.fetcher.state);
        let onDone = { resolve: (_) => { }, reject: (error) => { } };
        const promise = new Promise((resolve, reject) => {
            onDone = { resolve, reject };
        });
        // Store the repos selected by default so we can display them even if
        // they have not been loaded by the RepoFetcher yet.
        this.prefetchedRepos = new Map(selection.map(repo => [repo.id, { id: repo.id, name: repo.name }]));
        // Set the initial selection to the default selection.
        this.quickpick.selectedItems = this.quickpick.items = selection.map(repo => ({
            id: repo.id,
            label: repo.name,
            name: repo.name,
        }));
        this.handleRepoListChanged();
        // Ensure the workspace folder -> repository mapper has started so
        // the user can choose repositories from their workspace from a short
        // list.
        void this.workspaceRepoMapper.start();
        const workspaceChange = this.workspaceRepoMapper.onChange(() => this.handleRepoListChanged());
        void promise.finally(() => workspaceChange.dispose());
        // Refresh the repo list.
        if (this.fetcher.state !== repo_fetcher_1.RepoFetcherState.Complete) {
            (0, log_1.logDebug)('RepoPicker', 'continuing to fetch repositories list');
            this.fetcher.resume();
        }
        // Stop fetching repositories when the quickpick is dismissed.
        const didHide = this.quickpick.onDidHide(() => {
            if (this.fetcher.state !== repo_fetcher_1.RepoFetcherState.Complete) {
                (0, log_1.logDebug)('RepoPicker', 'pausing repo list fetching on hide');
                this.fetcher.pause();
            }
            onDone.resolve(undefined);
        });
        void promise.finally(() => didHide.dispose());
        const didAccept = this.quickpick.onDidAccept(() => {
            if (this.quickpick.selectedItems.length > this.maxSelectedRepoCount) {
                void vscode.window.showWarningMessage(`You can only select up to ${this.maxSelectedRepoCount} repositories.`);
                return;
            }
            onDone.resolve(this.quickpick.selectedItems.map(item => ({ name: item.name, id: item.id })));
            this.quickpick.hide();
        });
        void promise.finally(() => didAccept.dispose());
        // Show the quickpick
        this.quickpick.show();
        return promise;
    }
    handleRepoListChanged() {
        const selected = new Set(this.quickpick.selectedItems.map(item => item.id));
        const workspaceRepos = new Set(this.workspaceRepoMapper.workspaceRepos.map(item => item.id));
        const selectedItems = [];
        const workspaceItems = [];
        const items = [];
        const displayedRepos = new Set();
        for (const repo of [...this.fetcher.repositories, ...this.prefetchedRepos.values()]) {
            if (displayedRepos.has(repo.id)) {
                // De-dup prefetched and fetcher repos.
                continue;
            }
            displayedRepos.add(repo.id);
            const inWorkspace = workspaceRepos.has(repo.id);
            const shortName = repo.name.slice(repo.name.lastIndexOf('/') + 1);
            const item = {
                label: shortName,
                name: repo.name,
                id: repo.id,
                description: inWorkspace ? 'In your workspace' : '',
                detail: repo.name,
            };
            if (inWorkspace) {
                workspaceItems.push(item);
            }
            else {
                items.push(item);
            }
            if (selected.has(repo.id)) {
                selectedItems.push(item);
            }
        }
        this.quickpick.items = [
            {
                kind: vscode.QuickPickItemKind.Separator,
                label: 'Repositories in your workspace',
                name: 'SEPARATOR',
                id: 'SEPARATOR',
            },
            ...workspaceItems,
            {
                kind: vscode.QuickPickItemKind.Separator,
                label: 'Repositories from your Sourcegraph instance',
                name: 'SEPARATOR',
                id: 'SEPARATOR',
            },
            ...items,
        ];
        this.quickpick.selectedItems = selectedItems;
    }
}
exports.RemoteRepoPicker = RemoteRepoPicker;
