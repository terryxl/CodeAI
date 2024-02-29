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
exports.inferGitRepository = void 0;
const child_process_1 = require("child_process");
const util_1 = require("util");
const vscode = __importStar(require("vscode"));
const execPromise = (0, util_1.promisify)(child_process_1.exec);
/**
 * Returns a git repo metadata given any path that belongs to a git repo,
 * regardless if it's the root directory or not.
 *
 * This function invokes the `git` CLI with the assumption that it's going to be
 * installed on the user's computer. This is not going to work everywhere but
 * it's a starting point. Ideally, we should use a pure JS implementation
 * instead so that we don't have to rely on external tools.
 */
async function inferGitRepository(uri) {
    try {
        // invoking `git` like this works on Windows when git.exe is installed in Path.
        const { stdout: toplevel } = await execPromise('git rev-parse --show-toplevel', {
            cwd: uri.fsPath,
        });
        if (!toplevel) {
            return null;
        }
        const { stdout: commit } = await execPromise('git rev-parse --abbrev-ref HEAD', {
            cwd: uri.fsPath,
        });
        if (!commit) {
            return null;
        }
        return {
            uri: vscode.Uri.file(toplevel.trim()),
            commit: commit.trim(),
        };
    }
    catch {
        return null;
    }
}
exports.inferGitRepository = inferGitRepository;
