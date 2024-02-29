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
exports.getLensesForTask = void 0;
const vscode = __importStar(require("vscode"));
const cody_shared_1 = require("@sourcegraph/cody-shared");
const utils_1 = require("../utils");
const isRunningInsideAgent_1 = require("../../jsonrpc/isRunningInsideAgent");
// Create Lenses based on state
function getLensesForTask(task) {
    const codeLensRange = new vscode.Range(task.selectionRange.start, task.selectionRange.start);
    const isTest = task.intent === 'test';
    switch (task.state) {
        case utils_1.CodyTaskState.pending:
        case utils_1.CodyTaskState.working: {
            const title = getWorkingLens(codeLensRange);
            const cancel = getCancelLens(codeLensRange, task.id);
            return [title, cancel];
        }
        case utils_1.CodyTaskState.inserting: {
            if (isTest) {
                return [getUnitTestLens(codeLensRange)];
            }
            return [getInsertingLens(codeLensRange), getCancelLens(codeLensRange, task.id)];
        }
        case utils_1.CodyTaskState.applying: {
            const title = getApplyingLens(codeLensRange);
            const cancel = getCancelLens(codeLensRange, task.id);
            return [title, cancel];
        }
        case utils_1.CodyTaskState.formatting: {
            const title = getFormattingLens(codeLensRange);
            const skip = getFormattingSkipLens(codeLensRange, task.id);
            return [title, skip];
        }
        case utils_1.CodyTaskState.applied: {
            const accept = getAcceptLens(codeLensRange, task.id);
            const retry = getRetryLens(codeLensRange, task.id);
            const undo = getUndoLens(codeLensRange, task.id);
            const showDiff = getDiffLens(codeLensRange, task.id);
            if (isTest) {
                return [accept, undo];
            }
            return [accept, retry, undo, showDiff];
        }
        case utils_1.CodyTaskState.error: {
            const title = getErrorLens(codeLensRange, task);
            const discard = getDiscardLens(codeLensRange, task.id);
            return [title, discard];
        }
        default:
            return [];
    }
}
exports.getLensesForTask = getLensesForTask;
// List of lenses
function getErrorLens(codeLensRange, task) {
    const lens = new vscode.CodeLens(codeLensRange);
    if ((0, cody_shared_1.isRateLimitError)(task.error)) {
        if (task.error.upgradeIsAvailable) {
            lens.command = {
                title: '⚡️ Upgrade to Cody Pro',
                command: 'cody.show-rate-limit-modal',
                arguments: [
                    task.error.userMessage,
                    task.error.retryMessage,
                    task.error.upgradeIsAvailable,
                ],
            };
        }
        else {
            lens.command = {
                title: '$(warning) Rate Limit Exceeded',
                command: 'cody.show-rate-limit-modal',
                arguments: [
                    task.error.userMessage,
                    task.error.retryMessage,
                    task.error.upgradeIsAvailable,
                ],
            };
        }
    }
    else {
        lens.command = {
            title: '$(warning) Applying Edits Failed',
            command: 'cody.fixup.codelens.error',
            arguments: [task.id],
        };
    }
    return lens;
}
function getWorkingLens(codeLensRange) {
    const lens = new vscode.CodeLens(codeLensRange);
    lens.command = {
        title: '$(sync~spin) Cody is working...',
        command: 'cody.focus',
    };
    return lens;
}
function getInsertingLens(codeLensRange) {
    const lens = new vscode.CodeLens(codeLensRange);
    lens.command = {
        title: '$(sync~spin) Inserting...',
        command: 'cody.focus',
    };
    return lens;
}
function getApplyingLens(codeLensRange) {
    const lens = new vscode.CodeLens(codeLensRange);
    lens.command = {
        title: '$(sync~spin) Applying...',
        command: 'cody.focus',
    };
    return lens;
}
function getFormattingLens(codeLensRange) {
    const lens = new vscode.CodeLens(codeLensRange);
    lens.command = {
        title: '$(sync~spin) Formatting...',
        command: 'cody.focus',
    };
    return lens;
}
function getFormattingSkipLens(codeLensRange, id) {
    const lens = new vscode.CodeLens(codeLensRange);
    lens.command = {
        title: 'Skip',
        command: 'cody.fixup.codelens.skip-formatting',
        arguments: [id],
    };
    return lens;
}
function getCancelLens(codeLensRange, id) {
    const lens = new vscode.CodeLens(codeLensRange);
    const shortcut = (0, isRunningInsideAgent_1.isRunningInsideAgent)() ? '' : ` (${process.platform === 'darwin' ? '⌥Z' : 'Alt+Z'})`;
    lens.command = {
        title: `Cancel${shortcut}`,
        command: 'cody.fixup.codelens.cancel',
        arguments: [id],
    };
    return lens;
}
function getDiscardLens(codeLensRange, id) {
    const lens = new vscode.CodeLens(codeLensRange);
    lens.command = {
        title: 'Discard',
        command: 'cody.fixup.codelens.cancel',
        arguments: [id],
    };
    return lens;
}
function getDiffLens(codeLensRange, id) {
    const lens = new vscode.CodeLens(codeLensRange);
    lens.command = {
        title: 'Show Diff',
        command: 'cody.fixup.codelens.diff',
        arguments: [id],
    };
    return lens;
}
function getRetryLens(codeLensRange, id) {
    const lens = new vscode.CodeLens(codeLensRange);
    const shortcut = (0, isRunningInsideAgent_1.isRunningInsideAgent)() ? '' : ` (${process.platform === 'darwin' ? '⌥R' : 'Alt+R'})`;
    lens.command = {
        title: `Edit & Retry${shortcut}`,
        command: 'cody.fixup.codelens.retry',
        arguments: [id],
    };
    return lens;
}
function getUndoLens(codeLensRange, id) {
    const lens = new vscode.CodeLens(codeLensRange);
    const shortcut = (0, isRunningInsideAgent_1.isRunningInsideAgent)() ? '' : ` (${process.platform === 'darwin' ? '⌥X' : 'Alt+X'})`;
    lens.command = {
        title: `Undo${shortcut}`,
        command: 'cody.fixup.codelens.undo',
        arguments: [id],
    };
    return lens;
}
function getAcceptLens(codeLensRange, id) {
    const lens = new vscode.CodeLens(codeLensRange);
    const shortcut = (0, isRunningInsideAgent_1.isRunningInsideAgent)() ? '' : ` (${process.platform === 'darwin' ? '⌥A' : 'Alt+A'})`;
    lens.command = {
        title: `$(cody-logo) Accept${shortcut}`,
        command: 'cody.fixup.codelens.accept',
        arguments: [id],
    };
    return lens;
}
function getUnitTestLens(codeLensRange) {
    const lens = new vscode.CodeLens(codeLensRange);
    lens.command = {
        title: '$(sync~spin) Generating tests...',
        command: 'cody.focus',
    };
    return lens;
}
