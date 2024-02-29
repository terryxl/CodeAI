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
exports.main = void 0;
const fs_1 = __importStar(require("fs"));
const https_1 = __importDefault(require("https"));
const path_1 = __importDefault(require("path"));
const progress_1 = __importDefault(require("progress"));
const DIST_DIRECTORY = path_1.default.join(__dirname, '../dist');
const WASM_DIRECTORY = path_1.default.join(__dirname, '../resources/wasm');
// We have to manually copy this because it's resolved by tree-sitter package
// relative to the current `__dirname` which works fine if we do not bundle `node_modules`
// but fails for the VS Code distribution.
//
// https://github.com/tree-sitter/tree-sitter/discussions/1680
const TREE_SITTER_WASM_FILE = 'tree-sitter.wasm';
const TREE_SITTER_WASM_PATH = require.resolve(`web-tree-sitter/${TREE_SITTER_WASM_FILE}`);
const urls = [
    'https://storage.googleapis.com/sourcegraph-assets/cody-wasm/tree-sitter-javascript.wasm',
    'https://storage.googleapis.com/sourcegraph-assets/cody-wasm/tree-sitter-typescript.wasm',
    'https://storage.googleapis.com/sourcegraph-assets/cody-wasm/tree-sitter-tsx.wasm',
    'https://storage.googleapis.com/sourcegraph-assets/cody-wasm/tree-sitter-c_sharp.wasm',
    'https://storage.googleapis.com/sourcegraph-assets/cody-wasm/tree-sitter-cpp.wasm',
    'https://storage.googleapis.com/sourcegraph-assets/cody-wasm/tree-sitter-go.wasm',
    'https://storage.googleapis.com/sourcegraph-assets/cody-wasm/tree-sitter-python.wasm',
    'https://storage.googleapis.com/sourcegraph-assets/cody-wasm/tree-sitter-ruby.wasm',
    'https://storage.googleapis.com/sourcegraph-assets/cody-wasm/tree-sitter-rust.wasm',
    'https://storage.googleapis.com/sourcegraph-assets/cody-wasm/tree-sitter-java.wasm',
    'https://storage.googleapis.com/sourcegraph-assets/cody-wasm/tree-sitter-dart.wasm',
    'https://storage.googleapis.com/sourcegraph-assets/cody-wasm/tree-sitter-php.wasm',
];
async function main() {
    const hasStoreDir = (0, fs_1.existsSync)(WASM_DIRECTORY);
    if (!hasStoreDir) {
        (0, fs_1.mkdirSync)(WASM_DIRECTORY);
    }
    const filesToDownload = getMissingFiles(urls);
    if (filesToDownload.length === 0) {
        copyFilesToDistDir();
        console.log('All wasm modules are in place, have a good day!');
        return;
    }
    console.log(`We are missing ${filesToDownload.length} files.`);
    try {
        await Promise.all(filesToDownload.map(downloadFile));
        // HACK(sqs): Wait for files to be written. Otherwise sometimes the files are copied before
        // they are complete, which causes failures in AutocompleteMatcher.test.ts.
        await new Promise(resolve => setTimeout(resolve, 500));
        copyFilesToDistDir();
        console.log('All files were successful downloaded, check resources/wasm directory');
    }
    catch (error) {
        console.error('Some error occurred', error);
        process.exit(1);
    }
}
exports.main = main;
void main();
function copyFilesToDistDir() {
    const hasDistDir = (0, fs_1.existsSync)(DIST_DIRECTORY);
    if (!hasDistDir) {
        (0, fs_1.mkdirSync)(DIST_DIRECTORY);
    }
    const files = (0, fs_1.readdirSync)(WASM_DIRECTORY);
    for (const file of files) {
        (0, fs_1.copyFileSync)(path_1.default.join(WASM_DIRECTORY, file), path_1.default.join(DIST_DIRECTORY, file));
    }
    (0, fs_1.copyFileSync)(TREE_SITTER_WASM_PATH, path_1.default.join(DIST_DIRECTORY, TREE_SITTER_WASM_FILE));
}
function getMissingFiles(urls) {
    const missingFiles = [];
    for (const url of urls) {
        const filePath = getFilePathFromURL(url);
        if (!(0, fs_1.existsSync)(path_1.default.resolve(WASM_DIRECTORY, filePath))) {
            missingFiles.push(url);
        }
    }
    return missingFiles;
}
function getFilePathFromURL(url) {
    const parts = url.split('/');
    return parts.at(-1);
}
function downloadFile(url) {
    const fileName = getFilePathFromURL(url);
    const file = fs_1.default.createWriteStream(path_1.default.join(WASM_DIRECTORY, fileName));
    return new Promise((resolve, reject) => {
        https_1.default.get(url).on('response', res => {
            const contentLength = res.headers?.['content-length'] ?? '0';
            const totalLength = parseInt(contentLength, 10);
            const progress = new progress_1.default(`-> ${fileName} [:bar] :rate/bps :percent :etas`, {
                width: 40,
                complete: '=',
                incomplete: ' ',
                renderThrottle: 1,
                total: totalLength,
            });
            res.on('data', (chunk) => {
                file.write(chunk);
                progress.tick(chunk.length);
            })
                .on('end', () => {
                resolve(file.end());
            })
                .on('error', err => {
                console.log('\n');
                reject(err);
            });
        });
    });
}
//# sourceMappingURL=download-wasm-modules.js.map