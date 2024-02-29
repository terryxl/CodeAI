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
exports.LocalEmbeddingsController = exports.createLocalEmbeddingsController = void 0;
const vscode = __importStar(require("vscode"));
const vscode_uri_1 = require("vscode-uri");
const cody_shared_1 = require("@sourcegraph/cody-shared");
const spawn_bfg_1 = require("../graph/bfg/spawn-bfg");
const log_1 = require("../log");
const sentry_1 = require("../services/sentry/sentry");
function createLocalEmbeddingsController(context, config) {
    return new LocalEmbeddingsController(context, config);
}
exports.createLocalEmbeddingsController = createLocalEmbeddingsController;
function getIndexLibraryPath() {
    switch (process.platform) {
        case 'darwin':
            return vscode_uri_1.URI.file(`${process.env.HOME}/Library/Caches/com.sourcegraph.cody/embeddings`);
        case 'linux':
            return vscode_uri_1.URI.file(`${process.env.HOME}/.cache/com.sourcegraph.cody/embeddings`);
        case 'win32':
            return vscode_uri_1.URI.file(`${process.env.LOCALAPPDATA}\\com.sourcegraph.cody\\embeddings`);
        default:
            throw new Error(`Unsupported platform: ${process.platform}`);
    }
}
class LocalEmbeddingsController {
    context;
    disposables = [];
    // These properties are constants, but may be overridden for testing.
    model;
    endpoint;
    indexLibraryPath;
    // The cody-engine child process, if starting or started.
    service;
    // True if the service has finished starting and been initialized.
    serviceStarted = false;
    // The access token for Cody Gateway.
    accessToken;
    // Whether the account is a consumer account.
    endpointIsDotcom = false;
    // The last index we loaded, or attempted to load, if any.
    lastRepo;
    // The last health report, if any.
    lastHealth;
    // The last error from indexing, if any.
    lastError;
    // Map of cached states for loaded indexes.
    repoState = new Map();
    // If indexing is in progress, the path of the repo being indexed.
    dirBeingIndexed;
    // The status bar item local embeddings is displaying, if any.
    statusBar;
    // Fires when available local embeddings (may) have changed. This updates
    // the codebase context, which touches the network and file system, so only
    // use it for major changes like local embeddings being available at all,
    // or the first index for a repository comes online.
    changeEmitter = new vscode.EventEmitter();
    constructor(context, config) {
        this.context = context;
        (0, log_1.logDebug)('LocalEmbeddingsController', 'constructor');
        this.disposables.push(this.changeEmitter, this.statusEmitter);
        this.disposables.push(vscode.commands.registerCommand('cody.embeddings.resolveIssue', () => this.resolveIssueCommand()));
        // Pick up the initial access token, and whether the account is dotcom.
        this.accessToken = config.accessToken || undefined;
        this.endpointIsDotcom = (0, cody_shared_1.isDotCom)(config.serverEndpoint);
        this.model = config.testingLocalEmbeddingsModel || 'openai/text-embedding-ada-002';
        this.endpoint =
            config.testingLocalEmbeddingsEndpoint || 'https://cody-gateway.sourcegraph.com/v1/embeddings';
        this.indexLibraryPath = config.testingLocalEmbeddingsIndexLibraryPath
            ? vscode_uri_1.URI.file(config.testingLocalEmbeddingsIndexLibraryPath)
            : undefined;
    }
    dispose() {
        for (const disposable of this.disposables) {
            disposable.dispose();
        }
        this.statusBar?.dispose();
    }
    get onChange() {
        return this.changeEmitter.event;
    }
    // Hint that local embeddings should start cody-engine, if necessary.
    async start() {
        (0, log_1.logDebug)('LocalEmbeddingsController', 'start');
        await this.getService();
        const repoUri = vscode.workspace.workspaceFolders?.[0]?.uri;
        if (repoUri && (0, cody_shared_1.isFileURI)(repoUri)) {
            await this.eagerlyLoad(repoUri);
        }
    }
    async setAccessToken(serverEndpoint, token) {
        const endpointIsDotcom = (0, cody_shared_1.isDotCom)(serverEndpoint);
        (0, log_1.logDebug)('LocalEmbeddingsController', 'setAccessToken', endpointIsDotcom ? 'is dotcom' : 'not dotcom');
        if (endpointIsDotcom !== this.endpointIsDotcom) {
            // We will show, or hide, status depending on whether we are using
            // dotcom. We do not offer local embeddings to Enterprise.
            this.statusEmitter.fire(this);
            if (this.serviceStarted) {
                this.changeEmitter.fire(this);
            }
        }
        this.endpointIsDotcom = endpointIsDotcom;
        if (token === this.accessToken) {
            return Promise.resolve();
        }
        this.accessToken = token || undefined;
        // TODO: Add a "drop token" for sign out
        if (token && this.serviceStarted) {
            await (await this.getService()).request('embeddings/set-token', token);
        }
    }
    getService() {
        if (!this.service) {
            this.service = this.spawnAndBindService(this.context);
        }
        return this.service;
    }
    async spawnAndBindService(context) {
        const service = await new Promise((resolve, reject) => {
            (0, spawn_bfg_1.spawnBfg)(context, reject).then(bfg => resolve(bfg), error => {
                (0, sentry_1.captureException)(error);
                reject(error);
            });
        });
        // TODO: Add more states for cody-engine fetching and trigger status updates here
        service.registerNotification('embeddings/progress', obj => {
            if (typeof obj === 'object') {
                switch (obj.type) {
                    case 'progress': {
                        this.lastError = undefined;
                        const percent = Math.floor((100 * obj.numItems) / obj.totalItems);
                        if (this.statusBar) {
                            this.statusBar.text = `Indexing Embeddings… (${percent.toFixed(0)}%)`;
                            this.statusBar.backgroundColor = undefined;
                            this.statusBar.tooltip = obj.currentPath;
                            this.statusBar.show();
                        }
                        return;
                    }
                    case 'error': {
                        this.lastError = obj.message;
                        this.loadAfterIndexing();
                        return;
                    }
                    case 'done': {
                        this.lastError = undefined;
                        this.loadAfterIndexing();
                        return;
                    }
                }
            }
            (0, log_1.logDebug)('LocalEmbeddingsController', 'unknown notification', JSON.stringify(obj));
        });
        (0, log_1.logDebug)('LocalEmbeddingsController', 'spawnAndBindService', 'service started, initializing');
        let indexPath = getIndexLibraryPath();
        // Tests may override the index library path
        if (this.indexLibraryPath) {
            (0, log_1.logDebug)('LocalEmbeddingsController', 'spawnAndBindService', 'overriding index library path', this.indexLibraryPath);
            indexPath = this.indexLibraryPath;
        }
        const initResult = await service.request('embeddings/initialize', {
            codyGatewayEndpoint: this.endpoint,
            indexPath: indexPath.fsPath,
        });
        (0, log_1.logDebug)('LocalEmbeddingsController', 'spawnAndBindService', 'initialized', initResult, 'token available?', !!this.accessToken);
        if (this.accessToken) {
            // Set the initial access token
            await service.request('embeddings/set-token', this.accessToken);
        }
        this.serviceStarted = true;
        this.changeEmitter.fire(this);
        return service;
    }
    // After indexing succeeds or fails, try to load the index. Update state
    // indicating we are no longer loading the index.
    loadAfterIndexing() {
        if (this.dirBeingIndexed &&
            (!this.lastRepo || this.lastRepo.dir.toString() === this.dirBeingIndexed.toString())) {
            const path = this.dirBeingIndexed;
            void (async () => {
                const loadedOk = await this.eagerlyLoad(path);
                (0, log_1.logDebug)('LocalEmbeddingsController', 'load after indexing "done"', path, loadedOk);
                this.changeEmitter.fire(this);
                if (loadedOk && !this.lastError) {
                    await vscode.window.showInformationMessage('✨ Cody Embeddings Index Complete');
                }
            })();
        }
        if (this.statusBar) {
            this.statusBar.dispose();
            this.statusBar = undefined;
        }
        this.dirBeingIndexed = undefined;
        this.statusEmitter.fire(this);
    }
    // ContextStatusProvider implementation
    statusEmitter = new vscode.EventEmitter();
    onDidChangeStatus(callback) {
        return this.statusEmitter.event(callback);
    }
    get status() {
        (0, log_1.logDebug)('LocalEmbeddingsController', 'get status');
        if (!this.endpointIsDotcom) {
            // There are no local embeddings for Enterprise.
            return [];
        }
        // TODO: Summarize the path with ~, etc.
        const dir = this.lastRepo?.dir ?? vscode.workspace.workspaceFolders?.[0]?.uri;
        if (!dir || !this.lastRepo) {
            return [
                {
                    dir,
                    displayName: dir ? (0, cody_shared_1.uriBasename)(dir) : '(No workspace loaded)',
                    providers: [
                        {
                            kind: 'embeddings',
                            state: 'indeterminate',
                        },
                    ],
                },
            ];
        }
        if (this.dirBeingIndexed?.toString() === dir.toString()) {
            return [
                {
                    dir,
                    displayName: (0, cody_shared_1.uriBasename)(dir),
                    providers: [{ kind: 'embeddings', state: 'indexing' }],
                },
            ];
        }
        if (this.lastRepo.repoName) {
            return [
                {
                    dir,
                    displayName: (0, cody_shared_1.uriBasename)(dir),
                    providers: [
                        {
                            kind: 'embeddings',
                            state: 'ready',
                        },
                    ],
                },
            ];
        }
        const repoState = this.repoState.get(dir.toString());
        let stateAndErrors;
        if (repoState?.indexable) {
            stateAndErrors = { state: 'unconsented' };
        }
        else if (repoState?.errorReason) {
            stateAndErrors = { state: 'no-match', errorReason: repoState.errorReason };
        }
        else {
            (0, log_1.logDebug)('LocalEmbeddings', 'state', '"no-match" state should provide a reason');
            stateAndErrors = { state: 'no-match' };
        }
        return [
            {
                dir,
                displayName: (0, cody_shared_1.uriBasename)(dir),
                providers: [
                    {
                        kind: 'embeddings',
                        ...stateAndErrors,
                    },
                ],
            },
        ];
    }
    // Interactions with cody-engine
    async index() {
        if (!(this.endpointIsDotcom && this.lastRepo?.dir && !this.lastRepo?.repoName)) {
            // TODO: Support index updates.
            (0, log_1.logDebug)('LocalEmbeddingsController', 'index', 'no repository to index/already indexed');
            return;
        }
        const repoPath = this.lastRepo.dir;
        (0, log_1.logDebug)('LocalEmbeddingsController', 'index', 'starting repository', repoPath);
        await this.indexRequest({
            repoPath: repoPath.fsPath,
            mode: { type: 'new', model: this.model, dimension: 1536 },
        });
    }
    async indexRetry() {
        if (!(this.endpointIsDotcom && this.lastRepo?.dir)) {
            (0, log_1.logDebug)('LocalEmbeddingsController', 'indexRetry', 'no repository to retry');
            return;
        }
        const repoPath = this.lastRepo.dir;
        (0, log_1.logDebug)('LocalEmbeddingsController', 'indexRetry', 'continuing to index repository', repoPath);
        await this.indexRequest({ repoPath: repoPath.fsPath, mode: { type: 'continue' } });
    }
    async indexRequest(options) {
        try {
            await (await this.getService()).request('embeddings/index', options);
            this.dirBeingIndexed = vscode_uri_1.URI.file(options.repoPath);
            this.statusBar?.dispose();
            this.statusBar = vscode.window.createStatusBarItem('cody-local-embeddings', vscode.StatusBarAlignment.Right, 0);
            this.statusEmitter.fire(this);
        }
        catch (error) {
            (0, log_1.logDebug)('LocalEmbeddingsController', (0, sentry_1.captureException)(error), error);
            await vscode.window.showErrorMessage(`Cody Embeddings — Error: ${error?.message}`);
        }
    }
    async load(repoDir) {
        if (!this.endpointIsDotcom) {
            // Local embeddings only supported for dotcom
            return false;
        }
        if (!repoDir) {
            // There's no path to search
            return false;
        }
        if (!(0, cody_shared_1.isFileURI)(repoDir)) {
            // Local embeddings currently only supports the file system.
            return false;
        }
        const cachedState = this.repoState.get(repoDir.toString());
        if (cachedState && !cachedState.repoName) {
            // We already failed to loading this, so use that result
            return false;
        }
        if (!this.serviceStarted) {
            // Try starting the service but reply that there are no local
            // embeddings this time.
            void (async () => {
                try {
                    await this.getService();
                }
                catch (error) {
                    (0, log_1.logDebug)('LocalEmbeddingsController', 'load', (0, sentry_1.captureException)(error), JSON.stringify(error));
                }
            })();
            return false;
        }
        return this.eagerlyLoad(repoDir);
    }
    // Tries to load an index for the repo at the specified path, skipping any
    // cached results in `load`. This is used:
    // - When the service starts, to fulfill an earlier load request.
    // - When indexing finishes, to try to load the updated index.
    // - To implement the final step of `load`, if we did not hit any cached
    //   results.
    async eagerlyLoad(repoDir) {
        try {
            const { repoName } = await (await this.getService()).request('embeddings/load', repoDir.fsPath);
            this.repoState.set(repoDir.toString(), {
                repoName,
                indexable: true,
                errorReason: undefined,
            });
            this.lastRepo = {
                dir: repoDir,
                repoName,
            };
            // Start a health check on the index.
            void (async () => {
                try {
                    const health = await (await this.getService()).request('embeddings/index-health', {
                        repoName,
                    });
                    (0, log_1.logDebug)('LocalEmbeddingsController', 'index-health', JSON.stringify(health));
                    if (health.type !== 'found') {
                        return;
                    }
                    await this.onHealthReport(repoDir, health);
                }
                catch (error) {
                    (0, log_1.logDebug)('LocalEmbeddingsController', 'index-health', (0, sentry_1.captureException)(error), JSON.stringify(error));
                }
            })();
        }
        catch (error) {
            (0, log_1.logDebug)('LocalEmbeddingsController', 'load', (0, sentry_1.captureException)(error), JSON.stringify(error));
            const noRemoteErrorMessage = "repository does not have a default fetch URL, so can't be named for an index";
            const noRemote = error.message === noRemoteErrorMessage;
            const notAGitRepositoryErrorMessage = /does not appear to be a git repository/;
            const notGit = notAGitRepositoryErrorMessage.test(error.message);
            let errorReason;
            if (notGit) {
                errorReason = 'not-a-git-repo';
            }
            else if (noRemote) {
                errorReason = 'git-repo-has-no-remote';
            }
            else {
                errorReason = undefined;
            }
            this.repoState.set(repoDir.toString(), {
                repoName: false,
                indexable: !(notGit || noRemote),
                errorReason,
            });
            // TODO: Log telemetry error messages to prioritize supporting
            // repos without remotes, other SCCS, etc.
            this.lastRepo = { dir: repoDir, repoName: false };
        }
        this.statusEmitter.fire(this);
        return !!this.lastRepo?.repoName;
    }
    // After loading a repo, we asynchronously check whether the repository
    // still needs embeddings.
    async onHealthReport(repoDir, health) {
        if (repoDir.toString() !== this.lastRepo?.dir.toString()) {
            // We've loaded a different repo since this health report; ignore it.
            return;
        }
        this.lastHealth = health;
        const hasIssue = health.numItemsNeedEmbedding > 0;
        await vscode.commands.executeCommand('setContext', 'cody.embeddings.hasIssue', hasIssue);
        if (hasIssue) {
            this.updateIssueStatusBar();
        }
    }
    getNeedsEmbeddingText(options) {
        if (!this.lastHealth?.numItemsNeedEmbedding) {
            return '';
        }
        const percentDone = Math.floor((100 * (this.lastHealth.numItems - this.lastHealth.numItemsNeedEmbedding)) /
            this.lastHealth.numItems);
        return `${options?.prefix || ''}Cody Embeddings index for ${this.lastRepo?.dir || 'this repository'} is only ${percentDone.toFixed(0)}% complete.${options?.suffix || ''}`;
    }
    updateIssueStatusBar() {
        this.statusBar?.dispose();
        this.statusBar = vscode.window.createStatusBarItem('cody-local-embeddings', vscode.StatusBarAlignment.Right, 0);
        this.statusBar.text = 'Embeddings Incomplete';
        const needsEmbeddingMessage = this.getNeedsEmbeddingText({
            prefix: '\n\n',
            suffix: ' Click to resolve.',
        });
        const errorMessage = this.lastError ? `\n\nError: ${this.lastError}` : '';
        this.statusBar.tooltip = new vscode.MarkdownString(`#### Cody Embeddings Incomplete\n\n${needsEmbeddingMessage}${errorMessage}`);
        this.statusBar.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
        this.statusBar.command = 'cody.embeddings.resolveIssue';
        this.statusBar.show();
    }
    // The user has clicked on the status bar to resolve an issue with embeddings.
    resolveIssueCommand() {
        if (!(this.lastHealth || this.lastError)) {
            // There's nothing to do.
            return;
        }
        if (this.lastHealth?.numItemsNeedEmbedding) {
            void (async () => {
                try {
                    const errorMessage = this.lastError ? `\n\nError: ${this.lastError}` : '';
                    const choice = await vscode.window.showWarningMessage(this.getNeedsEmbeddingText() + errorMessage, 'Continue Indexing', 'Cancel');
                    switch (choice) {
                        case 'Cancel':
                            return;
                        case 'Continue Indexing':
                            await this.indexRetry();
                    }
                }
                catch (error) {
                    (0, log_1.logDebug)('LocalEmbeddingsController', 'resolveIssueCommand', (0, sentry_1.captureException)(error), JSON.stringify(error));
                    await vscode.window.showErrorMessage(`Cody Embeddings — Error resolving embeddings issue: ${error?.message}`);
                }
            })();
        }
    }
    /** {@link LocalEmbeddingsFetcher.getContext} */
    async getContext(query, _numResults) {
        if (!this.endpointIsDotcom) {
            return [];
        }
        const lastRepo = this.lastRepo;
        if (!lastRepo || !lastRepo.repoName) {
            return [];
        }
        try {
            const service = await this.getService();
            const resp = await service.request('embeddings/query', {
                repoName: lastRepo.repoName,
                query,
            });
            (0, log_1.logDebug)('LocalEmbeddingsController', 'query', `returning ${resp.results.length} results`);
            return resp.results.map(result => ({
                ...result,
                uri: vscode.Uri.joinPath(lastRepo.dir, result.fileName),
            }));
        }
        catch (error) {
            (0, log_1.logDebug)('LocalEmbeddingsController', 'query', (0, sentry_1.captureException)(error), error);
            return [];
        }
    }
}
exports.LocalEmbeddingsController = LocalEmbeddingsController;
