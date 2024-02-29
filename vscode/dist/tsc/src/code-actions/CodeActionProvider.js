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
exports.CodeActionProvider = void 0;
const vscode = __importStar(require("vscode"));
const document_1 = require("./document");
const edit_1 = require("./edit");
const explain_1 = require("./explain");
const fixup_1 = require("./fixup");
class CodeActionProvider {
    configurationChangeListener;
    actionProviders = [];
    constructor(options) {
        this.registerCodeActions(options.contextProvider.config);
        this.configurationChangeListener = options.contextProvider.configurationChangeEvent.event(() => {
            this.registerCodeActions(options.contextProvider.config);
        });
    }
    registerCodeActions(config) {
        vscode.Disposable.from(...this.actionProviders).dispose();
        this.actionProviders = [];
        if (!config.codeActions) {
            return;
        }
        this.addActionProvider(edit_1.EditCodeAction);
        this.addActionProvider(document_1.DocumentCodeAction);
        this.addActionProvider(explain_1.ExplainCodeAction);
        this.addActionProvider(fixup_1.FixupCodeAction);
    }
    addActionProvider(ActionType) {
        const provider = vscode.languages.registerCodeActionsProvider('*', new ActionType(), {
            providedCodeActionKinds: ActionType.providedCodeActionKinds,
        });
        this.actionProviders.push(provider);
    }
    dispose() {
        this.configurationChangeListener.dispose();
        vscode.Disposable.from(...this.actionProviders).dispose();
    }
}
exports.CodeActionProvider = CodeActionProvider;
