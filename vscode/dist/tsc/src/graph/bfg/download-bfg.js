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
exports.downloadBfg = void 0;
const fs = __importStar(require("fs"));
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
const axios_1 = __importDefault(require("axios"));
const unzipper = __importStar(require("unzipper"));
const vscode = __importStar(require("vscode"));
const download_symf_1 = require("../../local-context/download-symf");
const log_1 = require("../../log");
const os_1 = require("../../os");
const sentry_1 = require("../../services/sentry/sentry");
// Available releases: https://github.com/sourcegraph/bfg/releases
// Do not include 'v' in this string.
const defaultBfgVersion = '5.2.23617';
// We use this Promise to only have one downloadBfg running at once.
let serializeBfgDownload = Promise.resolve(null);
async function downloadBfg(context) {
    // First, wait for any in-progress downloads.
    await serializeBfgDownload;
    // Now we are the in-progress download.
    serializeBfgDownload = (async () => {
        const config = vscode.workspace.getConfiguration();
        const userBfgPath = config.get('cody.experimental.cody-engine.path');
        if (userBfgPath) {
            const bfgStat = await fs_1.promises.stat(userBfgPath);
            if (!bfgStat.isFile()) {
                throw new Error(`not a file: ${userBfgPath}`);
            }
            (0, log_1.logDebug)('CodyEngine', `using user-provided path: ${userBfgPath} ${bfgStat.isFile()}`);
            return userBfgPath;
        }
        const osArch = (0, os_1.getOSArch)();
        if (!osArch) {
            (0, log_1.logDebug)('CodyEngine', 'getOSArch returned nothing');
            return null;
        }
        const { platform, arch } = osArch;
        if (!arch) {
            (0, log_1.logDebug)('CodyEngine', 'getOSArch returned undefined arch');
            return null;
        }
        if (!platform) {
            (0, log_1.logDebug)('CodyEngine', 'getOSArch returned undefined platform');
            return null;
        }
        // Rename returned architecture to match RFC 795 conventions
        // https://docs.google.com/document/d/11cw-7dAp93JmasITNSNCtx31xrQsNB1L2OoxVE6zrTc/edit
        const archRenames = new Map([
            ['aarch64', 'arm64'],
            ['x86_64', 'x64'],
        ]);
        let rfc795Arch = archRenames.get(arch ?? '') ?? arch;
        if (rfc795Arch === 'arm64' && platform === 'win') {
            // On Windows Arm PCs, we rely on emulation and use the x64 binary.
            // See https://learn.microsoft.com/en-us/windows/arm/apps-on-arm-x86-emulation
            rfc795Arch = 'x64';
        }
        const bfgContainingDir = path_1.default.join(context.globalStorageUri.fsPath, 'cody-engine');
        const bfgVersion = config.get('cody.experimental.cody-engine.version', defaultBfgVersion);
        await fs_1.promises.mkdir(bfgContainingDir, { recursive: true });
        const bfgFilename = `cody-engine-${bfgVersion}-${platform}-${rfc795Arch}`;
        const bfgPath = path_1.default.join(bfgContainingDir, bfgFilename);
        const isAlreadyDownloaded = await (0, download_symf_1.fileExists)(bfgPath);
        if (isAlreadyDownloaded) {
            (0, log_1.logDebug)('CodyEngine', `using downloaded path "${bfgPath}"`);
            return bfgPath;
        }
        const bfgURL = `https://github.com/sourcegraph/bfg/releases/download/v${bfgVersion}/bfg-${platform}-${rfc795Arch}.zip`;
        try {
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Window,
                title: 'Downloading cody-engine',
                cancellable: false,
            }, async (progress) => {
                progress.report({ message: 'Downloading cody-engine' });
                const bfgZip = path_1.default.join(bfgContainingDir, 'bfg.zip');
                await downloadBfgBinary(bfgURL, bfgZip);
                await unzipBfg(bfgZip, bfgContainingDir);
                (0, log_1.logDebug)('CodyEngine', bfgPath);
                // The zip file contains a binary named `bfg` or `bfg.exe`. We unzip it with that name first and then rename into
                // a version-specific binary so that we can delete old versions of bfg.
                const unzipPath = platform === 'windows' ? 'bfg.exe' : 'bfg';
                await fs_1.promises.rename(path_1.default.join(bfgContainingDir, unzipPath), bfgPath);
                await fs_1.promises.chmod(bfgPath, 0o755);
                await fs_1.promises.rm(bfgZip);
                (0, log_1.logDebug)('CodyEngine', `downloaded cody-engine to ${bfgPath}`);
            });
            void removeOldBfgBinaries(bfgContainingDir, bfgFilename);
        }
        catch (error) {
            (0, sentry_1.captureException)(error);
            void vscode.window.showErrorMessage(`Failed to download bfg from URL ${bfgURL}: ${error}`);
            return null;
        }
        return bfgPath;
    })();
    return serializeBfgDownload;
}
exports.downloadBfg = downloadBfg;
async function unzipBfg(zipFile, destinationDir) {
    const zip = fs.createReadStream(zipFile).pipe(unzipper.Parse({ forceStream: true }));
    for await (const entry of zip) {
        if (entry.path.endsWith('/')) {
            continue;
        }
        entry.pipe(fs.createWriteStream(path_1.default.join(destinationDir, entry.path)));
    }
}
async function downloadBfgBinary(url, destination) {
    (0, log_1.logDebug)('CodyEngine', `downloading from URL ${url}`);
    const response = await (0, axios_1.default)({
        url,
        method: 'GET',
        responseType: 'stream',
        maxRedirects: 10,
    });
    const stream = fs.createWriteStream(destination);
    response.data.pipe(stream);
    await new Promise((resolve, reject) => {
        stream.on('finish', resolve);
        stream.on('error', reject);
    });
}
async function removeOldBfgBinaries(containingDir, currentBfgPath) {
    const bfgDirContents = await fs_1.promises.readdir(containingDir);
    const oldBfgBinaries = bfgDirContents.filter(f => f.startsWith('bfg') && f !== currentBfgPath);
    for (const oldBfgBinary of oldBfgBinaries) {
        await fs_1.promises.rm(path_1.default.join(containingDir, oldBfgBinary));
    }
}
