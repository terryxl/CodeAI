"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnterpriseContextFactory = void 0;
const repo_picker_1 = require("./repo-picker");
const remote_search_1 = require("./remote-search");
const workspace_repo_mapper_1 = require("./workspace-repo-mapper");
const repo_fetcher_1 = require("./repo-fetcher");
class EnterpriseContextFactory {
    // Only one RemoteRepoPicker can be displayed at once, so we share one
    // instance.
    repoPicker;
    fetcher;
    workspaceRepoMapper;
    constructor() {
        this.fetcher = new repo_fetcher_1.RepoFetcher();
        this.workspaceRepoMapper = new workspace_repo_mapper_1.WorkspaceRepoMapper();
        this.repoPicker = new repo_picker_1.RemoteRepoPicker(this.fetcher, this.workspaceRepoMapper);
    }
    dispose() {
        this.fetcher.dispose();
        this.repoPicker.dispose();
        this.workspaceRepoMapper.dispose();
    }
    clientConfigurationDidChange() {
        this.fetcher.clientConfigurationDidChange();
        this.workspaceRepoMapper.clientConfigurationDidChange();
    }
    // Creates a new RemoteSearch proxy. The RemoteSearch is stateful because
    // it maintains a set of selected repositories to search, so each chat panel
    // should use a separate instance. The returned RemoteSearch does not get
    // configuration updates; this is fine for the SimpleChatPanelProvider
    // client because chats are restarted if the configuration changes.
    createRemoteSearch() {
        return new remote_search_1.RemoteSearch();
    }
    // Gets an object that can map codebase repo names into repository IDs on
    // the Sourcegraph remote.
    getCodebaseRepoIdMapper() {
        return this.workspaceRepoMapper;
    }
}
exports.EnterpriseContextFactory = EnterpriseContextFactory;
