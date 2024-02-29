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
exports.FixupCodeAction = void 0;
const vscode = __importStar(require("vscode"));
const utils_1 = require("../editor/utils");
const FIX_PROMPT_TOPICS = {
    SOURCE: 'PROBLEMCODE4179',
    RELATED: 'RELATEDCODE50', // Note: We append additional digits to this topic as a single problem code can have multiple related code.
};
class FixupCodeAction {
    static providedCodeActionKinds = [vscode.CodeActionKind.QuickFix];
    async provideCodeActions(document, range, context) {
        const diagnostics = context.diagnostics.filter(diagnostic => diagnostic.severity === vscode.DiagnosticSeverity.Error ||
            diagnostic.severity === vscode.DiagnosticSeverity.Warning);
        if (diagnostics.length === 0) {
            return [];
        }
        // Expand range to include the full line for better fixup quality
        const expandedRange = new vscode.Range(document.lineAt(range.start.line).range.start, document.lineAt(range.end.line).range.end);
        // TODO bee check if the diagnostics are related to imports and include import ranges instead of error lines
        // const importDiagnostics = diagnostics.filter(diagnostic => diagnostic.message.includes('import'))
        // Expand range by getting the folding range contains the target (error) area
        const targetAreaRange = await (0, utils_1.getSmartSelection)(document.uri, range.start.line);
        const newRange = targetAreaRange
            ? new vscode.Range(targetAreaRange.start, targetAreaRange.end)
            : expandedRange;
        const codeAction = await this.createCommandCodeAction(document, diagnostics, newRange);
        return [codeAction];
    }
    async createCommandCodeAction(document, diagnostics, range) {
        const action = new vscode.CodeAction('Ask Cody to Fix', vscode.CodeActionKind.QuickFix);
        const instruction = await this.getCodeActionInstruction(document.getText(range), diagnostics);
        const source = 'code-action:fix';
        action.command = {
            command: 'cody.command.edit-code',
            arguments: [
                {
                    configuration: { instruction, range, intent: 'fix', document },
                    source,
                },
            ],
            title: 'Ask Cody to Fix',
        };
        action.diagnostics = diagnostics;
        return action;
    }
    // Public for testing
    async getCodeActionInstruction(code, diagnostics) {
        const prompt = [`<${FIX_PROMPT_TOPICS.SOURCE}>${code}</${FIX_PROMPT_TOPICS.SOURCE}>\n`];
        for (let i = 0; i < diagnostics.length; i++) {
            const { message, source, severity, relatedInformation } = diagnostics[i];
            const diagnosticType = severity === vscode.DiagnosticSeverity.Warning ? 'warning' : 'error';
            prompt.push(`Fix the following ${source ? `${source} ` : ''}${diagnosticType} from within <${FIX_PROMPT_TOPICS.SOURCE}></${FIX_PROMPT_TOPICS.SOURCE}>: ${message}`);
            if (relatedInformation?.length) {
                prompt.push('Code related to this diagnostic:');
                const relatedInfo = await this.getRelatedInformationContext(relatedInformation);
                prompt.push(...relatedInfo);
            }
            if (i < diagnostics.length - 1) {
                prompt.push('\n');
            }
        }
        return prompt.join('\n');
    }
    async getRelatedInformationContext(relatedInformation) {
        const prompt = [];
        for (let i = 0; i < relatedInformation.length; i++) {
            const { location, message } = relatedInformation[i];
            prompt.push(message);
            const document = await vscode.workspace.openTextDocument(location.uri);
            prompt.push(`<${FIX_PROMPT_TOPICS.RELATED}${i}>${document.getText(location.range)}</${FIX_PROMPT_TOPICS.RELATED}${i}>\n`);
        }
        return prompt;
    }
}
exports.FixupCodeAction = FixupCodeAction;
