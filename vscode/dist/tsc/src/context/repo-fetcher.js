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
exports.RepoFetcher = exports.RepoFetcherState = void 0;
const cody_shared_1 = require("@sourcegraph/cody-shared");
const vscode = __importStar(require("vscode"));
var RepoFetcherState;
(function (RepoFetcherState) {
    RepoFetcherState[RepoFetcherState["Paused"] = 0] = "Paused";
    RepoFetcherState[RepoFetcherState["Fetching"] = 1] = "Fetching";
    RepoFetcherState[RepoFetcherState["Errored"] = 2] = "Errored";
    RepoFetcherState[RepoFetcherState["Complete"] = 3] = "Complete";
})(RepoFetcherState || (exports.RepoFetcherState = RepoFetcherState = {}));
// RepoFetcher
// - Fetches repositories from a Sourcegraph instance.
// - Fetching can be paused and restarted.
// - Notifies a listener when the set of repositories has changed.
class RepoFetcher {
    state_ = RepoFetcherState.Paused;
    stateChangedEmitter = new vscode.EventEmitter();
    onStateChanged = this.stateChangedEmitter.event;
    repoListChangedEmitter = new vscode.EventEmitter();
    onRepoListChanged = this.repoListChangedEmitter.event;
    error_;
    configurationEpoch = 0;
    // The cursor at the end of the last fetched repositories.
    after;
    repos = [];
    dispose() {
        this.repoListChangedEmitter.dispose();
        this.stateChangedEmitter.dispose();
    }
    get lastError() {
        return this.error_;
    }
    clientConfigurationDidChange() {
        this.repos = [];
        this.after = undefined;
        this.state = RepoFetcherState.Paused;
        this.configurationEpoch++;
    }
    pause() {
        this.state = RepoFetcherState.Paused;
    }
    resume() {
        this.state = RepoFetcherState.Fetching;
        void this.fetch();
    }
    // Gets the known repositories. The set may be incomplete if fetching hasn't
    // finished, the cache is stale, etc.
    get repositories() {
        return this.repos;
    }
    get state() {
        return this.state_;
    }
    set state(newState) {
        if (this.state === newState) {
            return;
        }
        this.state_ = newState;
        this.stateChangedEmitter.fire(newState);
    }
    async fetch() {
        const numResultsPerQuery = 10_000;
        const configurationEpoch = this.configurationEpoch;
        if (this.state === RepoFetcherState.Paused) {
            return;
        }
        do {
            const result = await cody_shared_1.graphqlClient.getRepoList(numResultsPerQuery, this.after);
            if (this.configurationEpoch !== configurationEpoch) {
                // The configuration changed during this fetch, so stop.
                return;
            }
            if (result instanceof Error) {
                this.state = RepoFetcherState.Errored;
                this.error_ = result;
                (0, cody_shared_1.logDebug)('RepoFetcher', result.toString());
                return;
            }
            const newRepos = result.repositories.nodes;
            this.repos.push(...newRepos);
            this.repoListChangedEmitter.fire(this.repos);
            this.after = result.repositories.pageInfo.endCursor || undefined;
        } while (this.state === RepoFetcherState.Fetching && this.after);
        if (!this.after) {
            this.state = RepoFetcherState.Complete;
        }
    }
}
exports.RepoFetcher = RepoFetcher;
