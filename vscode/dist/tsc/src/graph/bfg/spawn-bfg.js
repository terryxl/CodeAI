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
exports.spawnBfg = void 0;
const child_process = __importStar(require("node:child_process"));
const vscode = __importStar(require("vscode"));
const jsonrpc_1 = require("../../jsonrpc/jsonrpc");
const log_1 = require("../../log");
const download_bfg_1 = require("./download-bfg");
async function spawnBfg(context, reject) {
    const bfg = new jsonrpc_1.MessageHandler();
    const codyrpc = await (0, download_bfg_1.downloadBfg)(context);
    if (!codyrpc) {
        throw new Error('Failed to download BFG binary. To fix this problem, set the "cody.experimental.cody-engine.path" configuration to the path of your BFG binary');
    }
    const isVerboseDebug = vscode.workspace.getConfiguration().get('cody.debug.verbose', false);
    const child = child_process.spawn(codyrpc, {
        stdio: 'pipe',
        env: {
            VERBOSE_DEBUG: `${isVerboseDebug}`,
            RUST_BACKTRACE: isVerboseDebug ? '1' : '0',
            // See bfg issue 138
            RUST_LIB_BACKTRACE: '0',
        },
    });
    child.stderr.on('data', chunk => {
        (0, log_1.logDebug)('CodyEngine', 'stderr', chunk.toString());
    });
    child.on('disconnect', () => reject());
    child.on('close', () => reject());
    child.on('error', error => reject(error));
    child.on('exit', code => {
        bfg.exit();
        reject(code);
    });
    child.stderr.pipe(process.stderr);
    child.stdout.pipe(bfg.messageDecoder);
    bfg.messageEncoder.pipe(child.stdin);
    return bfg;
}
exports.spawnBfg = spawnBfg;
