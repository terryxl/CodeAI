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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SymfRunner = void 0;
const node_child_process_1 = require("node:child_process");
const promises_1 = __importStar(require("node:fs/promises"));
const node_os_1 = __importDefault(require("node:os"));
const node_util_1 = require("node:util");
const async_mutex_1 = require("async-mutex");
const mkdirp_1 = require("mkdirp");
const vscode = __importStar(require("vscode"));
const cody_shared_1 = require("@sourcegraph/cody-shared");
const log_1 = require("../log");
const download_symf_1 = require("./download-symf");
const symfExpandQuery_1 = require("./symfExpandQuery");
const execFile = (0, node_util_1.promisify)(node_child_process_1.execFile);
class SymfRunner {
    context;
    sourcegraphServerEndpoint;
    authToken;
    completionsClient;
    // The root of all symf index directories
    indexRoot;
    indexLocks = new Map();
    status = new IndexStatus();
    constructor(context, sourcegraphServerEndpoint, authToken, completionsClient) {
        this.context = context;
        this.sourcegraphServerEndpoint = sourcegraphServerEndpoint;
        this.authToken = authToken;
        this.completionsClient = completionsClient;
        const indexRoot = vscode.Uri.joinPath(context.globalStorageUri, 'symf', 'indexroot').with(
        // On VS Code Desktop, this is a `vscode-userdata:` URI that actually just refers to
        // file system paths.
        vscode.env.uiKind === vscode.UIKind.Desktop ? { scheme: 'file' } : {});
        if (!(0, cody_shared_1.isFileURI)(indexRoot)) {
            throw new Error('symf only supports running on the file system');
        }
        this.indexRoot = indexRoot;
    }
    dispose() {
        this.status.dispose();
    }
    onIndexStart(cb) {
        return this.status.onDidStart(cb);
    }
    onIndexEnd(cb) {
        return this.status.onDidEnd(cb);
    }
    setSourcegraphAuth(endpoint, authToken) {
        this.sourcegraphServerEndpoint = endpoint;
        this.authToken = authToken;
    }
    async getSymfInfo() {
        const accessToken = this.authToken;
        if (!accessToken) {
            throw new Error('SymfRunner.getResults: No access token');
        }
        const serverEndpoint = this.sourcegraphServerEndpoint;
        if (!serverEndpoint) {
            throw new Error('SymfRunner.getResults: No Sourcegraph server endpoint');
        }
        const symfPath = await (0, download_symf_1.getSymfPath)(this.context);
        if (!symfPath) {
            throw new Error('No symf executable');
        }
        return { accessToken, serverEndpoint, symfPath };
    }
    getResults(userQuery, scopeDirs) {
        const expandedQuery = (0, symfExpandQuery_1.symfExpandQuery)(this.completionsClient, userQuery);
        return Promise.resolve(scopeDirs
            .filter(cody_shared_1.isFileURI)
            .map(scopeDir => this.getResultsForScopeDir(expandedQuery, scopeDir)));
    }
    /**
     * Returns the list of results from symf for a single directory scope.
     * @param keywordQuery is a promise, because query expansion might be an expensive
     * operation that is best done concurrently with querying and (re)building the index.
     */
    async getResultsForScopeDir(keywordQuery, scopeDir) {
        const maxRetries = 10;
        // Run in a loop in case the index is deleted before we can query it
        for (let i = 0; i < maxRetries; i++) {
            await this.getIndexLock(scopeDir).withWrite(async () => {
                await this.unsafeEnsureIndex(scopeDir, { hard: i === 0 });
            });
            let indexNotFound = false;
            const stdout = await this.getIndexLock(scopeDir).withRead(async () => {
                // Check again if index exists after we have the read lock
                if (!(await this.unsafeIndexExists(scopeDir))) {
                    indexNotFound = true;
                    return '';
                }
                return this.unsafeRunQuery(await keywordQuery, scopeDir);
            });
            if (indexNotFound) {
                continue;
            }
            const results = parseSymfStdout(stdout);
            return results;
        }
        throw new Error(`failed to find index after ${maxRetries} tries for directory ${scopeDir}`);
    }
    async deleteIndex(scopeDir) {
        await this.getIndexLock(scopeDir).withWrite(async () => {
            await this.unsafeDeleteIndex(scopeDir);
        });
    }
    async getIndexStatus(scopeDir) {
        if (this.status.isInProgress(scopeDir)) {
            // Check this before waiting on the lock
            return 'indexing';
        }
        const hasIndex = await this.getIndexLock(scopeDir).withRead(async () => {
            return this.unsafeIndexExists(scopeDir);
        });
        if (hasIndex) {
            return 'ready';
        }
        if (await this.didIndexFail(scopeDir)) {
            return 'failed';
        }
        return 'unindexed';
    }
    async ensureIndex(scopeDir, options = { hard: false }) {
        await this.getIndexLock(scopeDir).withWrite(async () => {
            await this.unsafeEnsureIndex(scopeDir, options);
        });
    }
    getIndexLock(scopeDir) {
        const { indexDir } = this.getIndexDir(scopeDir);
        let lock = this.indexLocks.get(indexDir.toString());
        if (lock) {
            return lock;
        }
        lock = new RWLock();
        this.indexLocks.set(indexDir.toString(), lock);
        return lock;
    }
    async unsafeRunQuery(keywordQuery, scopeDir) {
        const { indexDir } = this.getIndexDir(scopeDir);
        const { accessToken, symfPath, serverEndpoint } = await this.getSymfInfo();
        try {
            const { stdout } = await execFile(symfPath, [
                '--index-root',
                indexDir.fsPath,
                'query',
                '--scopes',
                scopeDir.fsPath,
                '--fmt',
                'json',
                keywordQuery,
            ], {
                env: {
                    SOURCEGRAPH_TOKEN: accessToken,
                    SOURCEGRAPH_URL: serverEndpoint,
                    HOME: process.env.HOME,
                },
                maxBuffer: 1024 * 1024 * 1024,
                timeout: 1000 * 30, // timeout in 30 seconds
            });
            return stdout;
        }
        catch (error) {
            throw toSymfError(error);
        }
    }
    async unsafeDeleteIndex(scopeDir) {
        const trashRootDir = vscode.Uri.joinPath(this.indexRoot, '.trash');
        await (0, mkdirp_1.mkdirp)(trashRootDir.fsPath);
        const { indexDir } = this.getIndexDir(scopeDir);
        if (!(await fileExists(indexDir))) {
            // index directory no longer exists, nothing to do
            return;
        }
        // Unique name for trash directory
        const trashDir = vscode.Uri.joinPath(trashRootDir, `${(0, cody_shared_1.uriBasename)(indexDir)}-${Date.now()}`);
        if (await fileExists(trashDir)) {
            // if trashDir already exists, error
            throw new Error(`could not delete index ${indexDir}: target trash directory ${trashDir} already exists`);
        }
        await (0, promises_1.rename)(indexDir.fsPath, trashDir.fsPath);
        void (0, promises_1.rm)(trashDir.fsPath, { recursive: true, force: true }); // delete in background
    }
    async unsafeIndexExists(scopeDir) {
        const { indexDir } = this.getIndexDir(scopeDir);
        return fileExists(vscode.Uri.joinPath(indexDir, 'index.json'));
    }
    async unsafeEnsureIndex(scopeDir, options = { hard: false }) {
        const indexExists = await this.unsafeIndexExists(scopeDir);
        if (indexExists) {
            return;
        }
        if (!options.hard && (await this.didIndexFail(scopeDir))) {
            // Index build previous failed, so don't try to rebuild
            (0, log_1.logDebug)('symf', 'index build previously failed and `hard` === false, not rebuilding');
            return;
        }
        const { indexDir, tmpDir } = this.getIndexDir(scopeDir);
        try {
            await this.unsafeUpsertIndex(indexDir, tmpDir, scopeDir);
        }
        catch (error) {
            (0, log_1.logDebug)('symf', 'symf index creation failed', error);
            await this.markIndexFailed(scopeDir);
            throw error;
        }
        await this.clearIndexFailure(scopeDir);
    }
    getIndexDir(scopeDir) {
        let indexSubdir = scopeDir.path;
        // On Windows, we can't use an absolute path with a drive letter inside another path
        // so we remove the colon, so `/c:/foo/` becomes `/c/foo` and `/c%3A/foo` becomes `/c/foo`.
        if ((0, cody_shared_1.isWindows)()) {
            if (indexSubdir[2] === ':') {
                indexSubdir = indexSubdir.slice(0, 2) + indexSubdir.slice(3);
            }
            else if (indexSubdir.slice(2, 5) === '%3A') {
                indexSubdir = indexSubdir.slice(0, 2) + indexSubdir.slice(5);
            }
        }
        return {
            indexDir: (0, cody_shared_1.assertFileURI)(vscode.Uri.joinPath(this.indexRoot, indexSubdir)),
            tmpDir: (0, cody_shared_1.assertFileURI)(vscode.Uri.joinPath(this.indexRoot, '.tmp', indexSubdir)),
        };
    }
    unsafeUpsertIndex(indexDir, tmpIndexDir, scopeDir) {
        const cancellation = new vscode.CancellationTokenSource();
        const upsert = this._unsafeUpsertIndex(indexDir, tmpIndexDir, scopeDir, cancellation.token);
        this.status.didStart({ scopeDir, done: upsert, cancel: () => cancellation.cancel() });
        void upsert.finally(() => {
            this.status.didEnd({ scopeDir });
            cancellation.dispose();
        });
        return upsert;
    }
    async _unsafeUpsertIndex(indexDir, tmpIndexDir, scopeDir, cancellationToken) {
        const symfPath = await (0, download_symf_1.getSymfPath)(this.context);
        if (!symfPath) {
            return;
        }
        await Promise.all([
            (0, promises_1.rm)(indexDir.fsPath, { recursive: true }).catch(() => undefined),
            (0, promises_1.rm)(tmpIndexDir.fsPath, { recursive: true }).catch(() => undefined),
        ]);
        (0, log_1.logDebug)('symf', 'creating index', indexDir);
        let maxCPUs = 1;
        if (node_os_1.default.cpus().length > 4) {
            maxCPUs = 2;
        }
        const disposeOnFinish = [];
        if (cancellationToken.isCancellationRequested) {
            throw new vscode.CancellationError();
        }
        let wasCancelled = false;
        let onExit;
        try {
            const proc = (0, node_child_process_1.spawn)(symfPath, ['--index-root', tmpIndexDir.fsPath, 'add', scopeDir.fsPath], {
                env: {
                    ...process.env,
                    GOMAXPROCS: `${maxCPUs}`, // use at most one cpu for indexing
                },
                stdio: ['ignore', 'ignore', 'ignore'],
                timeout: 1000 * 60 * 10, // timeout in 10 minutes
            });
            onExit = () => {
                proc.kill('SIGKILL');
            };
            process.on('exit', onExit);
            if (cancellationToken.isCancellationRequested) {
                wasCancelled = true;
                proc.kill('SIGKILL');
            }
            else {
                disposeOnFinish.push(cancellationToken.onCancellationRequested(() => {
                    wasCancelled = true;
                    proc.kill('SIGKILL');
                }));
            }
            // wait for proc to finish
            await new Promise((resolve, reject) => {
                proc.on('error', reject);
                proc.on('exit', code => {
                    if (code === 0) {
                        resolve();
                    }
                    else {
                        reject(new Error(`symf exited with code ${code}`));
                    }
                });
            });
            await (0, mkdirp_1.mkdirp)((0, cody_shared_1.uriDirname)(indexDir).fsPath);
            await (0, promises_1.rename)(tmpIndexDir.fsPath, indexDir.fsPath);
        }
        catch (error) {
            if (wasCancelled) {
                throw new vscode.CancellationError();
            }
            throw toSymfError(error);
        }
        finally {
            if (onExit) {
                process.removeListener('exit', onExit);
            }
            vscode.Disposable.from(...disposeOnFinish).dispose();
            await (0, promises_1.rm)(tmpIndexDir.fsPath, { recursive: true, force: true });
        }
    }
    /**
     * Helpers for tracking index failure
     */
    async markIndexFailed(scopeDir) {
        const failureRoot = vscode.Uri.joinPath(this.indexRoot, '.failed');
        await (0, mkdirp_1.mkdirp)(failureRoot.fsPath);
        const failureSentinelFile = vscode.Uri.joinPath(failureRoot, scopeDir.path.replaceAll('/', '__'));
        await (0, promises_1.writeFile)(failureSentinelFile.fsPath, '');
    }
    async didIndexFail(scopeDir) {
        const failureRoot = vscode.Uri.joinPath(this.indexRoot, '.failed');
        const failureSentinelFile = vscode.Uri.joinPath(failureRoot, scopeDir.path.replaceAll('/', '__'));
        return fileExists(failureSentinelFile);
    }
    async clearIndexFailure(scopeDir) {
        const failureRoot = vscode.Uri.joinPath(this.indexRoot, '.failed');
        const failureSentinelFile = vscode.Uri.joinPath(failureRoot, scopeDir.path.replaceAll('/', '__'));
        await (0, promises_1.rm)(failureSentinelFile.fsPath, { force: true });
    }
}
exports.SymfRunner = SymfRunner;
class IndexStatus {
    startEmitter = new vscode.EventEmitter();
    stopEmitter = new vscode.EventEmitter();
    inProgressDirs = new Set();
    dispose() {
        this.startEmitter.dispose();
        this.stopEmitter.dispose();
    }
    didStart(event) {
        this.inProgressDirs.add(event.scopeDir.toString());
        this.startEmitter.fire(event);
    }
    didEnd(event) {
        this.inProgressDirs.delete(event.scopeDir.toString());
        this.stopEmitter.fire(event);
    }
    onDidStart(cb) {
        return this.startEmitter.event(cb);
    }
    onDidEnd(cb) {
        return this.stopEmitter.event(cb);
    }
    isInProgress(scopeDir) {
        return this.inProgressDirs.has(scopeDir.toString());
    }
}
async function fileExists(file) {
    if (!(0, cody_shared_1.isFileURI)(file)) {
        throw new Error('only file URIs are supported');
    }
    try {
        await (0, promises_1.access)(file.fsPath, promises_1.default.constants.F_OK);
        return true;
    }
    catch {
        return false;
    }
}
function parseSymfStdout(stdout) {
    const results = JSON.parse(stdout);
    return results.map(result => {
        const { fqname, name, type, doc, exported, lang, file: fsPath, range, summary } = result;
        const { row: startRow, col: startColumn } = range.startPoint;
        const { row: endRow, col: endColumn } = range.endPoint;
        const startByte = range.startByte;
        const endByte = range.endByte;
        return {
            fqname,
            name,
            type,
            doc,
            exported,
            lang,
            file: vscode.Uri.file(fsPath),
            summary,
            range: {
                startByte,
                endByte,
                startPoint: {
                    row: startRow,
                    col: startColumn,
                },
                endPoint: {
                    row: endRow,
                    col: endColumn,
                },
            },
        };
    });
}
/**
 * A simple read-write lock.
 *
 * Note: it is possible for an overlapping succession of readers to starve out
 * any writers that are waiting for the mutex to be released. In practice, this
 * is not an issue, because we don't expect the user to issue neverending
 * while trying to update the index.
 */
class RWLock {
    /**
     * Invariants:
     * - if readers > 0, then mu is locked
     * - if readers === 0 and mu is locked, then a writer is holding the lock
     */
    readers = 0;
    mu = new async_mutex_1.Mutex();
    async withRead(fn) {
        while (this.readers === 0) {
            if (this.mu.isLocked()) {
                // If mu is locked at this point, it must be held by the writer.
                // We spin in this case, rather than try to acquire the lock,
                // because multiple readers blocked on acquiring the lock will
                // execute serially when the writer releases the lock (whereas
                // we want all reads to be concurrent).
                await new Promise(resolve => setTimeout(resolve, 100));
                continue;
            }
            // No readers or writers: acquire lock for readers
            await this.mu.acquire();
            break;
        }
        this.readers++;
        try {
            return await fn();
        }
        finally {
            this.readers--;
            if (this.readers === 0) {
                this.mu.release();
            }
        }
    }
    async withWrite(fn) {
        return this.mu.runExclusive(fn);
    }
}
function toSymfError(error) {
    const errorString = `${error}`;
    let errorMessage;
    if (errorString.includes('ENOENT')) {
        errorMessage =
            'symf binary not found. Do you have "cody.experimental.symf.path" set and is it valid?';
    }
    else if (errorString.includes('401')) {
        errorMessage = `symf: Unauthorized. Is Cody signed in? ${error}`;
    }
    else {
        errorMessage = `symf index creation failed: ${error}`;
    }
    return new EvalError(errorMessage);
}
