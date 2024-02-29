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
exports.ExplainCodeAction = void 0;
const vscode = __importStar(require("vscode"));
class ExplainCodeAction {
    static providedCodeActionKinds = [vscode.CodeActionKind.QuickFix];
    provideCodeActions(document, range, context) {
        const diagnostics = context.diagnostics.filter(diagnostic => diagnostic.severity === vscode.DiagnosticSeverity.Error ||
            diagnostic.severity === vscode.DiagnosticSeverity.Warning);
        if (diagnostics.length === 0) {
            return [];
        }
        return [this.createCommandCodeAction(diagnostics)];
    }
    createCommandCodeAction(diagnostics) {
        const action = new vscode.CodeAction('Ask Cody to Explain', vscode.CodeActionKind.QuickFix);
        const instruction = this.getCodeActionInstruction(diagnostics);
        action.command = {
            command: 'cody.action.chat',
            arguments: [
                {
                    text: instruction,
                    source: 'code-action:explain',
                    submitType: 'user-newchat',
                },
            ],
            title: 'Ask Cody to Explain',
        };
        action.diagnostics = diagnostics;
        return action;
    }
    getCodeActionInstruction = (diagnostics) => `Explain the following error${diagnostics.length > 1 ? 's' : ''}:\n\n${diagnostics
        .map(({ message }) => `\`\`\`${message}\`\`\``)
        .join('\n\n')}`;
}
exports.ExplainCodeAction = ExplainCodeAction;
