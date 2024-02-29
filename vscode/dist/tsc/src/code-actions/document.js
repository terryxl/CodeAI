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
exports.DocumentCodeAction = void 0;
const vscode = __importStar(require("vscode"));
const query_sdk_1 = require("../tree-sitter/query-sdk");
class DocumentCodeAction {
    static providedCodeActionKinds = [vscode.CodeActionKind.RefactorRewrite];
    provideCodeActions(document, range) {
        const [documentableNode] = (0, query_sdk_1.execQueryWrapper)(document, range.start, 'getDocumentableNode');
        if (!documentableNode) {
            return [];
        }
        const { node, name } = documentableNode;
        // Expand the range from the node to include the full line
        const documentableRange = new vscode.Range(document.lineAt(node.startPosition.row).range.start, document.lineAt(node.endPosition.row).range.end);
        const displayText = name === 'documentableNode'
            ? `Ask Cody to Document: ${node.text}`
            : 'Ask Cody to Document This Export';
        return [this.createCommandCodeAction(document, documentableRange, displayText)];
    }
    createCommandCodeAction(document, range, displayText) {
        const action = new vscode.CodeAction(displayText, vscode.CodeActionKind.RefactorRewrite);
        const source = 'code-action:document';
        action.command = {
            command: 'cody.command.edit-code',
            arguments: [
                {
                    configuration: {
                        instruction: this.instruction,
                        range,
                        intent: 'doc',
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
    /**
     * Edit instruction for generating documentation.
     * Note: This is a clone of the hard coded instruction in `lib/shared/src/chat/prompts/cody.json`.
     * TODO: (umpox) Consider moving top level instructions out of the JSON format.
     */
    instruction = 'Write a brief documentation comment for the selected code. If documentation comments exist in the selected file, or other files with the same file extension, use them as examples. Pay attention to the scope of the selected code (e.g. exported function/API vs implementation detail in a function), and use the idiomatic style for that type of code scope. Only generate the documentation for the selected code, do not generate the code. Do not output any other code or comments besides the documentation. Output only the comment and do not enclose it in markdown.';
}
exports.DocumentCodeAction = DocumentCodeAction;
