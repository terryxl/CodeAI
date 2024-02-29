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
exports.EditCodeAction = void 0;
const vscode = __importStar(require("vscode"));
class EditCodeAction {
    static providedCodeActionKinds = [vscode.CodeActionKind.RefactorRewrite];
    provideCodeActions(document) {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return [];
        }
        if (editor.selection.isEmpty &&
            !document.lineAt(editor.selection.start.line).isEmptyOrWhitespace) {
            // Empty selection but a non-empty line, show nothing as the user likely won't want to generate here.
            return [];
        }
        if (editor.selection.isEmpty) {
            // Empty selection and empty line, show generate action
            return [this.createGenerateCodeAction(document, editor.selection)];
        }
        // Non-empty selection, show edit action
        return [this.createEditCommandCodeAction(document, editor.selection)];
    }
    createGenerateCodeAction(document, selection) {
        const displayText = 'Ask Cody to Generate';
        const source = 'code-action:generate';
        const action = new vscode.CodeAction(displayText, vscode.CodeActionKind.RefactorRewrite);
        action.command = {
            command: 'cody.command.edit-code',
            arguments: [
                {
                    configuration: {
                        range: new vscode.Range(selection.start, selection.end),
                        intent: 'add',
                        document,
                        mode: 'insert',
                    },
                    source,
                },
            ],
            title: displayText,
        };
        return action;
    }
    createEditCommandCodeAction(document, selection) {
        const displayText = 'Ask Cody to Edit';
        const source = 'code-action:edit';
        const action = new vscode.CodeAction(displayText, vscode.CodeActionKind.RefactorRewrite);
        action.command = {
            command: 'cody.command.edit-code',
            arguments: [
                {
                    configuration: {
                        range: new vscode.Range(selection.start, selection.end),
                        intent: 'edit',
                        document,
                    },
                    source,
                },
            ],
            title: displayText,
        };
        return action;
    }
}
exports.EditCodeAction = EditCodeAction;
