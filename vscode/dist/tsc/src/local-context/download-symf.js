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
exports.fileExists = exports.getSymfPath = void 0;
const fs = __importStar(require("fs"));
const promises_1 = __importDefault(require("fs/promises"));
const os = __importStar(require("os"));
const path = __importStar(require("path"));
const axios_1 = __importDefault(require("axios"));
const unzipper = __importStar(require("unzipper"));
const vscode = __importStar(require("vscode"));
const log_1 = require("../log");
const os_1 = require("../os");
const sentry_1 = require("../services/sentry/sentry");
const symfVersion = 'v0.0.6';
/**
 * Get the path to `symf`. If the symf binary is not found, download it.
 */
async function getSymfPath(context) {
    // If user-specified symf path is set, use that
    const config = vscode.workspace.getConfiguration();
    const userSymfPath = config.get('cody.experimental.symf.path');
    if (userSymfPath) {
        (0, log_1.logDebug)('symf', `using user symf: ${userSymfPath}`);
        return userSymfPath;
    }
    const { platform, arch } = (0, os_1.getOSArch)();
    if (!platform || !arch) {
        // show vs code error message
        void vscode.window.showErrorMessage(`No symf binary available for ${os.platform()}/${os.machine()}`);
        return null;
    }
    const symfContainingDir = path.join(context.globalStorageUri.fsPath, 'symf');
    const symfFilename = `symf-${symfVersion}-${arch}-${platform}`;
    const symfPath = path.join(symfContainingDir, symfFilename);
    if (await fileExists(symfPath)) {
        (0, log_1.logDebug)('symf', `using downloaded symf "${symfPath}"`);
        return symfPath;
    }
    // Releases (eg at https://github.com/sourcegraph/symf/releases) are named with the Zig platform
    // identifier (linux-musl, windows-gnu, macos).
    const zigPlatform = platform === 'linux' ? 'linux-musl' : platform === 'windows' ? 'windows-gnu' : platform;
    const symfURL = `https://github.com/sourcegraph/symf/releases/download/${symfVersion}/symf-${arch}-${zigPlatform}.zip`;
    (0, log_1.logDebug)('symf', `downloading symf from ${symfURL}`);
    // Download symf binary with vscode progress api
    try {
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: 'Downloading Cody search engine (symf)',
            cancellable: false,
        }, async (progress) => {
            const symfTmpDir = `${symfPath}.tmp`;
            progress.report({ message: 'Downloading symf and extracting symf' });
            await promises_1.default.mkdir(symfTmpDir, { recursive: true });
            const symfZipFile = path.join(symfTmpDir, `${symfFilename}.zip`);
            await downloadFile(symfURL, symfZipFile);
            await unzipSymf(symfZipFile, symfTmpDir);
            (0, log_1.logDebug)('symf', `downloaded symf to ${symfTmpDir}`);
            const tmpFile = path.join(symfTmpDir, `symf-${arch}-${zigPlatform}`);
            await promises_1.default.chmod(tmpFile, 0o755);
            await promises_1.default.rename(tmpFile, symfPath);
            await promises_1.default.rm(symfTmpDir, { recursive: true });
            (0, log_1.logDebug)('symf', `extracted symf to ${symfPath}`);
        });
        void removeOldSymfBinaries(symfContainingDir, symfFilename);
    }
    catch (error) {
        (0, sentry_1.captureException)(error);
        void vscode.window.showErrorMessage(`Failed to download symf: ${error}`);
        return null;
    }
    return symfPath;
}
exports.getSymfPath = getSymfPath;
async function fileExists(path) {
    try {
        await promises_1.default.access(path);
        return true;
    }
    catch {
        return false;
    }
}
exports.fileExists = fileExists;
async function downloadFile(url, outputPath) {
    (0, log_1.logDebug)('Symf', `downloading from URL ${url}`);
    const response = await (0, axios_1.default)({
        url,
        method: 'GET',
        responseType: 'stream',
        maxRedirects: 10,
    });
    const stream = fs.createWriteStream(outputPath);
    response.data.pipe(stream);
    await new Promise((resolve, reject) => {
        stream.on('finish', resolve);
        stream.on('error', reject);
    });
}
async function unzipSymf(zipFile, destinationDir) {
    const zip = fs.createReadStream(zipFile).pipe(unzipper.Parse({ forceStream: true }));
    for await (const entry of zip) {
        if (entry.path.endsWith('/')) {
            continue;
        }
        entry.pipe(fs.createWriteStream(path.join(destinationDir, entry.path)));
    }
}
async function removeOldSymfBinaries(containingDir, currentSymfPath) {
    const symfDirContents = await promises_1.default.readdir(containingDir);
    const oldSymfBinaries = symfDirContents.filter(f => f.startsWith('symf-') && f !== currentSymfPath);
    for (const oldSymfBinary of oldSymfBinaries) {
        await promises_1.default.rm(path.join(containingDir, oldSymfBinary));
    }
}
