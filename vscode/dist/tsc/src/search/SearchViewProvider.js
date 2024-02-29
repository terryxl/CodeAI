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
exports.SearchViewProvider = void 0;
const vscode = __importStar(require("vscode"));
const cody_shared_1 = require("@sourcegraph/cody-shared");
const active_editor_1 = require("../editor/active-editor");
const searchDecorationType = vscode.window.createTextEditorDecorationType({
    backgroundColor: new vscode.ThemeColor('searchEditor.findMatchBackground'),
    borderColor: new vscode.ThemeColor('searchEditor.findMatchBorder'),
});
class CancellationManager {
    tokenSource;
    cancelExistingAndStartNew() {
        if (this.tokenSource) {
            this.tokenSource.cancel();
            this.tokenSource.dispose();
        }
        this.tokenSource = new vscode.CancellationTokenSource();
        return this.tokenSource.token;
    }
    dispose() {
        if (this.tokenSource) {
            const ts = this.tokenSource;
            this.tokenSource = undefined;
            ts.cancel();
            ts.dispose();
        }
    }
}
class IndexManager {
    symf;
    currentlyRefreshing = new Map();
    scopeDirIndexInProgress = new Map();
    disposables = [];
    constructor(symf) {
        this.symf = symf;
        this.disposables.push(this.symf.onIndexStart(event => this.showIndexProgress(event)));
    }
    dispose() {
        vscode.Disposable.from(...this.disposables).dispose();
    }
    /**
     * Show a warning message if indexing is already in progress for scopeDirs.
     * This is needed, because the user may have dismissed previous indexing progress
     * messages.
     */
    showMessageIfIndexingInProgress(scopeDirs) {
        const indexingScopeDirs = [];
        for (const scopeDir of scopeDirs) {
            if (this.scopeDirIndexInProgress.has(scopeDir.toString())) {
                indexingScopeDirs.push(scopeDir);
            }
        }
        if (indexingScopeDirs.length === 0) {
            return;
        }
        void vscode.window.showWarningMessage(`Still indexing: ${indexingScopeDirs.map(cody_shared_1.displayPath).join(', ')}`);
    }
    showIndexProgress({ scopeDir, cancel, done }) {
        if (this.scopeDirIndexInProgress.has(scopeDir.toString())) {
            void vscode.window.showWarningMessage(`Duplicate index request for ${(0, cody_shared_1.displayPath)(scopeDir)}`);
            return;
        }
        this.scopeDirIndexInProgress.set(scopeDir.toString(), done);
        void done.finally(() => {
            this.scopeDirIndexInProgress.delete(scopeDir.toString());
        });
        void vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: `Building Cody search index for ${(0, cody_shared_1.displayPath)(scopeDir)}`,
            cancellable: true,
        }, async (_progress, token) => {
            if (token.isCancellationRequested) {
                cancel();
            }
            else {
                token.onCancellationRequested(() => cancel());
            }
            await done;
        });
    }
    refreshIndex(scopeDir) {
        const fromCache = this.currentlyRefreshing.get(scopeDir.toString());
        if (fromCache) {
            return fromCache;
        }
        const result = this.forceRefreshIndex(scopeDir);
        this.currentlyRefreshing.set(scopeDir.toString(), result);
        return result;
    }
    async forceRefreshIndex(scopeDir) {
        try {
            await this.symf.deleteIndex(scopeDir);
            await this.symf.ensureIndex(scopeDir, { hard: true });
        }
        catch (error) {
            if (!(error instanceof vscode.CancellationError)) {
                void vscode.window.showErrorMessage(`Error refreshing search index for ${(0, cody_shared_1.displayPath)(scopeDir)}: ${error}`);
            }
        }
        finally {
            this.currentlyRefreshing.delete(scopeDir.toString());
        }
    }
}
class SearchViewProvider {
    extensionUri;
    symfRunner;
    disposables = [];
    webview;
    cancellationManager = new CancellationManager();
    indexManager;
    constructor(extensionUri, symfRunner) {
        this.extensionUri = extensionUri;
        this.symfRunner = symfRunner;
        this.indexManager = new IndexManager(this.symfRunner);
        this.disposables.push(this.indexManager);
        this.disposables.push(this.cancellationManager);
    }
    dispose() {
        for (const d of this.disposables) {
            d.dispose();
        }
        this.disposables = [];
    }
    initialize() {
        this.disposables.push(vscode.commands.registerCommand('cody.search.index-update', async () => {
            const scopeDirs = getScopeDirs();
            if (scopeDirs.length === 0) {
                void vscode.window.showWarningMessage('Open a workspace folder to index');
                return;
            }
            await this.indexManager.refreshIndex(scopeDirs[0]);
        }), vscode.commands.registerCommand('cody.search.index-update-all', async () => {
            const folders = vscode.workspace.workspaceFolders
                ?.map(folder => folder.uri)
                .filter(cody_shared_1.isFileURI);
            if (!folders) {
                void vscode.window.showWarningMessage('Open a workspace folder to index');
                return;
            }
            for (const folder of folders) {
                await this.indexManager.refreshIndex(folder);
            }
        }));
        // Kick off search index creation for all workspace folders
        if (vscode.workspace.workspaceFolders) {
            for (const folder of vscode.workspace.workspaceFolders) {
                if ((0, cody_shared_1.isFileURI)(folder.uri)) {
                    void this.symfRunner.ensureIndex(folder.uri, { hard: false });
                }
            }
        }
        this.disposables.push(vscode.workspace.onDidChangeWorkspaceFolders(event => {
            for (const folder of event.added) {
                if ((0, cody_shared_1.isFileURI)(folder.uri)) {
                    void this.symfRunner.ensureIndex(folder.uri, {
                        hard: false,
                    });
                }
            }
        }));
        this.disposables.push(this.symfRunner.onIndexEnd(({ scopeDir }) => {
            void this.webview?.postMessage({ type: 'index-updated', scopeDir });
        }));
    }
    async resolveWebviewView(webviewView) {
        this.webview = webviewView.webview;
        const webviewPath = vscode.Uri.joinPath(this.extensionUri, 'dist', 'webviews');
        webviewView.webview.options = {
            enableScripts: true,
            enableCommandUris: true,
            localResourceRoots: [webviewPath],
        };
        // Create Webview using vscode/index.html
        const root = vscode.Uri.joinPath(webviewPath, 'search.html');
        const bytes = await vscode.workspace.fs.readFile(root);
        const decoded = new TextDecoder('utf-8').decode(bytes);
        const resources = webviewView.webview.asWebviewUri(webviewPath);
        // Set HTML for webview
        // This replace variables from the vscode/dist/index.html with webview info
        // 1. Update URIs to load styles and scripts into webview (eg. path that starts with ./)
        // 2. Update URIs for content security policy to only allow specific scripts to be run
        webviewView.webview.html = decoded
            .replaceAll('./', `${resources.toString()}/`)
            .replaceAll('{cspSource}', webviewView.webview.cspSource);
        // Register to receive messages from webview
        this.disposables.push(webviewView.webview.onDidReceiveMessage(message => this.onDidReceiveMessage((0, cody_shared_1.hydrateAfterPostMessage)(message, uri => vscode.Uri.from(uri)))));
    }
    async onDidReceiveMessage(message) {
        switch (message.command) {
            case 'search': {
                await this.onDidReceiveQuery(message.query);
                break;
            }
            case 'show-search-result': {
                const { range, uri } = message;
                const vscodeRange = new vscode.Range(range.start.line, range.start.character, range.end.line, range.end.character);
                // show file and range in editor
                const doc = await vscode.workspace.openTextDocument(uri);
                const editor = await vscode.window.showTextDocument(doc, {
                    selection: vscodeRange,
                    preserveFocus: true,
                });
                const isWholeFile = vscodeRange.start.line === 0 && vscodeRange.end.line === doc.lineCount - 1;
                if (!isWholeFile) {
                    editor.setDecorations(searchDecorationType, [vscodeRange]);
                    editor.revealRange(vscodeRange, vscode.TextEditorRevealType.InCenterIfOutsideViewport);
                }
                break;
            }
        }
    }
    // TODO(beyang): support cancellation through symf
    async onDidReceiveQuery(query) {
        const cancellationToken = this.cancellationManager.cancelExistingAndStartNew();
        if (query.trim().length === 0) {
            await this.webview?.postMessage({ type: 'update-search-results', results: [] });
            return;
        }
        const symf = this.symfRunner;
        if (!symf) {
            throw new Error('this.symfRunner is undefined');
        }
        const scopeDirs = getScopeDirs();
        if (scopeDirs.length === 0) {
            void vscode.window.showErrorMessage('Open a workspace folder to determine the search scope');
            return;
        }
        // Check cancellation after index is ready
        if (cancellationToken.isCancellationRequested) {
            return;
        }
        // Update the config. We could do this on a smarter schedule, but this suffices for when the
        // webview needs it for now.
        this.webview?.postMessage({
            type: 'search:config',
            workspaceFolderUris: vscode.workspace.workspaceFolders?.map(folder => folder.uri.toString()) ?? [],
        });
        await vscode.window.withProgress({ location: { viewId: 'cody.search' } }, async () => {
            const cumulativeResults = [];
            this.indexManager.showMessageIfIndexingInProgress(scopeDirs);
            const resultSets = await symf.getResults(query, scopeDirs);
            for (const resultSet of resultSets) {
                try {
                    cumulativeResults.push(...(await resultsToDisplayResults(await resultSet)));
                    await this.webview?.postMessage({
                        type: 'update-search-results',
                        results: cumulativeResults,
                        query,
                    });
                }
                catch (error) {
                    if (error instanceof vscode.CancellationError) {
                        void vscode.window.showErrorMessage('No search results because indexing was canceled');
                    }
                    else {
                        void vscode.window.showErrorMessage(`Error fetching results for query "${query}": ${error}`);
                    }
                }
            }
        });
    }
}
exports.SearchViewProvider = SearchViewProvider;
/**
 * @returns the list of workspace folders to search. The first folder is the active file's folder.
 */
function getScopeDirs() {
    const folders = vscode.workspace.workspaceFolders?.map(f => f.uri).filter(cody_shared_1.isFileURI);
    if (!folders) {
        return [];
    }
    const uri = (0, active_editor_1.getEditor)().active?.document.uri;
    if (!uri) {
        return folders;
    }
    const currentFolder = vscode.workspace.getWorkspaceFolder(uri);
    if (!currentFolder) {
        return folders;
    }
    return [
        (0, cody_shared_1.isFileURI)(currentFolder.uri) ? currentFolder.uri : undefined,
        ...folders.filter(folder => folder.toString() !== currentFolder.uri.toString()),
    ].filter(cody_shared_1.isDefined);
}
function groupByFile(results) {
    const groups = [];
    for (const result of results) {
        const group = groups.find(g => g.file.toString() === result.file.toString());
        if (group) {
            group.results.push(result);
        }
        else {
            groups.push({
                file: result.file,
                results: [result],
            });
        }
    }
    return groups;
}
async function resultsToDisplayResults(results) {
    const textDecoder = new TextDecoder('utf-8');
    const groupedResults = groupByFile(results);
    return (await Promise.all(groupedResults.map(async (group) => {
        try {
            const contents = await vscode.workspace.fs.readFile(group.file);
            return {
                uri: group.file,
                snippets: group.results.map((result) => {
                    return {
                        contents: textDecoder.decode(contents.subarray(result.range.startByte, result.range.endByte)),
                        range: {
                            start: {
                                line: result.range.startPoint.row,
                                character: result.range.startPoint.col,
                            },
                            end: {
                                line: result.range.endPoint.row,
                                character: result.range.endPoint.col,
                            },
                        },
                    };
                }),
            };
        }
        catch {
            return null;
        }
    }))).filter(result => result !== null);
}
