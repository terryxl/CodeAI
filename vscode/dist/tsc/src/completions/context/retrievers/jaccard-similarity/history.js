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
exports.VSCodeDocumentHistory = void 0;
const vscode = __importStar(require("vscode"));
class VSCodeDocumentHistory {
    window = 50;
    // tracks history in chronological order (latest at the end of the array)
    history;
    subscriptions = [];
    constructor(register = () => vscode.window.onDidChangeActiveTextEditor(event => {
        if (!event?.document.uri) {
            return;
        }
        this.addItem({
            document: event.document,
        });
    })) {
        this.history = [];
        if (register) {
            const disposable = register();
            if (disposable) {
                this.subscriptions.push(disposable);
            }
        }
    }
    dispose() {
        vscode.Disposable.from(...this.subscriptions).dispose();
    }
    addItem(newItem) {
        if (newItem.document.uri.scheme === 'codegen') {
            return;
        }
        const foundIndex = this.history.findIndex(item => item.document.uri.toString() === newItem.document.uri.toString());
        if (foundIndex >= 0) {
            this.history = [...this.history.slice(0, foundIndex), ...this.history.slice(foundIndex + 1)];
        }
        this.history.push(newItem);
        if (this.history.length > this.window) {
            this.history.shift();
        }
    }
    /**
     * Returns the last n items of history in reverse chronological order (latest item at the front)
     */
    lastN(n, languageId, ignoreUris) {
        const ret = [];
        const ignoreSet = new Set(ignoreUris || []);
        for (let i = this.history.length - 1; i >= 0; i--) {
            const item = this.history[i];
            if (ret.length > n) {
                break;
            }
            if (ignoreSet.has(item.document.uri)) {
                continue;
            }
            if (languageId && languageId !== item.document.languageId) {
                continue;
            }
            ret.push(item);
        }
        return ret;
    }
}
exports.VSCodeDocumentHistory = VSCodeDocumentHistory;
