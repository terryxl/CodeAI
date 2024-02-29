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
exports.BfgRetriever = void 0;
const vscode = __importStar(require("vscode"));
const spawn_bfg_1 = require("../../../../graph/bfg/spawn-bfg");
const log_1 = require("../../../../log");
const repositoryHelpers_1 = require("../../../../repository/repositoryHelpers");
const sentry_1 = require("../../../../services/sentry/sentry");
const doc_context_getters_1 = require("../../../doc-context-getters");
const simple_git_1 = require("./simple-git");
class BfgRetriever {
    context;
    identifier = 'bfg';
    loadedBFG;
    bfgIndexingPromise = Promise.resolve(undefined);
    awaitIndexing;
    didFailLoading = false;
    // Keys are repository URIs, values are revisions (commit hashes).
    indexedRepositoryRevisions = new Map();
    constructor(context) {
        this.context = context;
        this.awaitIndexing = vscode.workspace
            .getConfiguration()
            .get('cody.experimental.cody-engine.await-indexing', false);
        this.loadedBFG = this.loadBFG();
        this.loadedBFG.then(() => { }, error => {
            (0, sentry_1.captureException)(error);
            this.didFailLoading = true;
            (0, log_1.logDebug)('CodyEngine', 'failed to initialize', error);
        });
        this.bfgIndexingPromise = this.indexWorkspace();
    }
    async indexWorkspace() {
        await this.indexGitRepositories();
        await this.indexRemainingWorkspaceFolders();
    }
    isWorkspaceIndexed(folder) {
        const uri = folder.toString();
        (0, log_1.logDebug)('CodyEngine', 'Checking if folder is indexed', uri);
        for (const key of this.indexedRepositoryRevisions.keys()) {
            if (uri.startsWith(key)) {
                return true;
            }
        }
        return false;
    }
    async indexRemainingWorkspaceFolders() {
        (0, log_1.logDebug)('CodyEngine', 'workspaceFolders', vscode.workspace.workspaceFolders?.map(folder => folder.uri.toString()) ?? []);
        for (const folder of vscode.workspace.workspaceFolders ?? []) {
            if (this.isWorkspaceIndexed(folder.uri)) {
                continue;
            }
            await this.indexEntry({ workspace: folder.uri });
        }
    }
    async indexGitRepositories() {
        const git = (0, repositoryHelpers_1.gitAPI)();
        if (!git) {
            return;
        }
        for (const repository of git.repositories) {
            await this.didChangeGitExtensionRepository(repository);
        }
        this.context.subscriptions.push(git.onDidOpenRepository(repository => this.didChangeGitExtensionRepository(repository)));
        this.context.subscriptions.push(vscode.workspace.onDidChangeWorkspaceFolders(() => this.indexInferredGitRepositories()));
        // TODO: handle closed repositories
        await this.indexInferredGitRepositories();
    }
    shouldInferGitRepositories() {
        // Some users may not want to allow Cody to index code outside the VS
        // Code workspace folder so we support an escape hatch to disable this
        // functionality. This setting is hidden because all the other
        // BFG-related settings are hidden.
        return vscode.workspace
            .getConfiguration()
            .get('cody.experimental.cody-engine.index-parent-git-folder', false);
    }
    // Infers what git repositories that are relevant but may not be "open" by
    // the git extension.  For example, by default, the git extension doesn't
    // open git repositories when the workspace root is a subfolder. There's a
    // setting to automatically open parent git repositories but the setting is
    // disabled by default.
    async indexInferredGitRepositories() {
        if (!this.shouldInferGitRepositories()) {
            return;
        }
        for (const folder of vscode.workspace.workspaceFolders ?? []) {
            if (this.indexedRepositoryRevisions.has(folder.uri.toString())) {
                continue;
            }
            const repo = await (0, simple_git_1.inferGitRepository)(folder.uri);
            if (repo) {
                await this.didChangeSimpleRepository(repo);
            }
        }
    }
    async didChangeGitExtensionRepository(repository) {
        const commit = repository?.state?.HEAD?.commit;
        if (!commit) {
            return;
        }
        await this.didChangeSimpleRepository({ uri: repository.rootUri, commit });
    }
    async didChangeSimpleRepository(repository) {
        const uri = repository.uri.toString();
        if (repository.commit !== this.indexedRepositoryRevisions.get(uri)) {
            this.indexedRepositoryRevisions.set(uri, repository.commit ?? '');
            await this.indexEntry({ repository });
        }
    }
    async indexEntry(params) {
        const { repository, workspace } = params;
        if (!repository && !workspace) {
            return;
        }
        const bfg = await this.loadedBFG;
        const indexingStartTime = Date.now();
        // TODO: include commit?
        try {
            if (repository) {
                await bfg.request('bfg/gitRevision/didChange', {
                    gitDirectoryUri: repository.uri.toString(),
                });
            }
            if (workspace) {
                await bfg.request('bfg/workspace/didChange', { workspaceUri: workspace.toString() });
            }
            const elapsed = Date.now() - indexingStartTime;
            const label = repository
                ? `${repository.uri.fsPath}:${repository.commit}`
                : workspace
                    ? workspace.fsPath
                    : '';
            if (label) {
                (0, log_1.logDebug)('CodyEngine', `gitRevision/didChange ${label} indexing time ${elapsed}ms`);
            }
        }
        catch (error) {
            (0, log_1.logDebug)('CodyEngine', `indexing error ${error}`);
        }
    }
    async retrieve({ document, position, docContext, hints, }) {
        try {
            if (this.didFailLoading) {
                return [];
            }
            const bfg = await this.loadedBFG;
            if (!bfg.isAlive()) {
                (0, log_1.logDebug)('CodyEngine', 'not alive');
                return [];
            }
            if (this.awaitIndexing) {
                await this.bfgIndexingPromise;
            }
            const responses = await bfg.request('bfg/contextAtPosition', {
                uri: document.uri.toString(),
                content: (await vscode.workspace.openTextDocument(document.uri)).getText(),
                position: { line: position.line, character: position.character },
                maxChars: hints.maxChars, // ignored by BFG server for now
                contextRange: (0, doc_context_getters_1.getContextRange)(document, docContext),
            });
            // Just in case, handle non-object results
            if (typeof responses !== 'object') {
                return [];
            }
            const mergedContextSnippets = [...(responses.symbols || []), ...(responses?.files || [])];
            // Convert BFG snippets to match the format expected on the client.
            const symbols = mergedContextSnippets.map(contextSnippet => ({
                ...contextSnippet,
                uri: vscode.Uri.from({ scheme: 'file', path: contextSnippet.fileName }),
            }));
            (0, log_1.logDebug)('CodyEngine', 'bfg/contextAtPosition', `returning ${mergedContextSnippets.length} results`);
            // TODO: add `startLine` and `endLine` to `responses` or explicitly add
            // another context snippet type to the client.
            // @ts-ignore
            return symbols;
        }
        catch (error) {
            (0, log_1.logDebug)('CodyEngine:error', `${error}`);
            return [];
        }
    }
    isSupportedForLanguageId(languageId) {
        switch (languageId) {
            case 'typescript':
            case 'typescriptreact':
            case 'javascript':
            case 'javascriptreact':
            case 'java':
            case 'go':
            case 'dart':
            case 'python':
            case 'zig':
                return true;
            default:
                return false;
        }
    }
    dispose() {
        if (this.didFailLoading) {
            return;
        }
        this.loadedBFG.then(bfg => bfg.request('bfg/shutdown', null), () => { });
    }
    // We lazily load BFG to allow the Cody extension to finish activation as
    // quickly as possible.
    loadBFG() {
        // This is implemented as a custom promise instead of async/await so that we can reject
        // the promise in the 'exit' handler if we fail to start the bfg process for some reason.
        return new Promise((resolve, reject) => {
            (0, log_1.logDebug)('CodyEngine', 'loading bfg');
            this.doLoadBFG(reject).then(bfg => resolve(bfg), error => {
                (0, sentry_1.captureException)(error);
                reject(error);
            });
        });
    }
    async doLoadBFG(reject) {
        const bfg = await (0, spawn_bfg_1.spawnBfg)(this.context, reject);
        await bfg.request('bfg/initialize', { clientName: 'vscode' });
        return bfg;
    }
}
exports.BfgRetriever = BfgRetriever;
