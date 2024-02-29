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
const dedent_1 = __importDefault(require("dedent"));
const vitest_1 = require("vitest");
const vscode = __importStar(require("vscode"));
const cody_shared_1 = require("@sourcegraph/cody-shared");
const fixup_1 = require("./fixup");
(0, vitest_1.describe)('fixup code action', () => {
    (0, vitest_1.test)('produces correct prompt for code with a single diagnostic', async () => {
        const text = (0, dedent_1.default) `
        export function getRerankWithLog(
            chatClient: ChatClient
        ): (query: string, results: ContextResult[]) => Promise<ContextResult[]> {
            if (TestSupport.instance) {
                const reranker = TestSupport.instance.getReranker()
                return (query: string, results: ContextResult[]): Promise<ContextResult[]> => reranker.rerank(query, results)
            }

            const reranker = new LLMReranker(chatClient)
            return async (userQuery: string, results: ContextResult[]): Promise<ContextResult[]> => {
                const start = performance.now()
                const rerankedResults = await reranker.rerank(userQuery, results)
                const duration = performance.now() - start
                logDebug('Reranker:rerank', JSON.stringify({ duration }))
                const rerank
            }
        }
        `;
        const diagnostic = [
            {
                severity: vscode.DiagnosticSeverity.Error,
                message: "Type 'null' is not assignable to type 'ContextResult[]'.",
                range: new vscode.Range(21, 8, 21, 14),
                source: 'ts',
                code: 2322,
            },
        ];
        const codeAction = new fixup_1.FixupCodeAction();
        const prompt = await codeAction.getCodeActionInstruction(text, diagnostic);
        (0, vitest_1.expect)(prompt).toMatchSnapshot();
    });
    (0, vitest_1.test)('produces correct prompt for a limited diagnostic', async () => {
        const text = (0, dedent_1.default) `
        export function getRerankWithLog(
            chatClient: ChatClient
        ): (query: string, results: ContextResult[]) => Promise<ContextResult[]> {
            if (TestSupport.instance) {
                const reranker = TestSupport.instance.getReranker()
                return (query: string, results: ContextResult[]): Promise<ContextResult[]> => reranker.rerank(query, results)
            }

            const reranker = new LLMReranker(chatClient)
            return async (userQuery: string, results: ContextResult[]): Promise<ContextResult[]> => {
                const start = performance.now()
                const rerankedResults = await reranker.rerank(userQuery, results)
                const duration = performance.now() - start
                logDebug('Reranker:rerank', JSON.stringify({ duration }))
                const rerank
            }
        }
        `;
        const diagnostic = [
            {
                severity: vscode.DiagnosticSeverity.Warning,
                message: "Type 'null' is not assignable to type 'ContextResult[]'.",
                range: new vscode.Range(new vscode.Position(21, 8), new vscode.Position(21, 14)),
            },
        ];
        const codeAction = new fixup_1.FixupCodeAction();
        const prompt = await codeAction.getCodeActionInstruction(text, diagnostic);
        (0, vitest_1.expect)(prompt).toMatchSnapshot();
    });
    (0, vitest_1.test)('produces correct prompt for code with multiple diagnostics and overlapping ranges', async () => {
        const text = (0, dedent_1.default) `
        export function getRerankWithLog(
            chatClient: ChatClient
        ): (query: string, results: ContextResult[]) => Promise<ContextResult[]> {
            if (TestSupport.instance) {
                const reranker = TestSupport.instance.getReranker()
                return (query: string, results: ContextResult[]): Promise<ContextResult[]> => reranker.rerank(query, results)
            }

            const reranker = new LLMReranker(chatClient)
            return async (userQuery: string, results: ContextResult[]): Promise<ContextResult[]> => {
                const start = performance.now()
                const rerankedResults = await reranker.rerank(userQuery, results)
                const duration = performance.now() - start
                logDebug('Reranker:rerank', JSON.stringify({ duration }))
                const rerank
            }
        }
        `;
        const diagnostics = [
            {
                severity: vscode.DiagnosticSeverity.Error,
                message: "'const' declarations must be initialized.",
                range: new vscode.Range(21, 14, 21, 20),
                source: 'ts',
                code: 1155,
            },
            {
                severity: vscode.DiagnosticSeverity.Warning,
                message: "'rerank' is declared but its value is never read.",
                range: new vscode.Range(21, 14, 21, 20),
                source: 'ts',
                code: 6133,
            },
            {
                severity: vscode.DiagnosticSeverity.Error,
                message: "Variable 'rerank' implicitly has an 'any' type.",
                range: new vscode.Range(21, 14, 21, 20),
                source: 'ts',
                code: 7005,
            },
        ];
        const codeAction = new fixup_1.FixupCodeAction();
        const prompt = await codeAction.getCodeActionInstruction(text, diagnostics);
        (0, vitest_1.expect)(prompt).toMatchSnapshot();
    });
    (0, vitest_1.test)('produces correct prompt for diagnostics with related information', async () => {
        const testDocUri = (0, cody_shared_1.testFileUri)('document1.ts');
        const diagnostics = [
            {
                severity: vscode.DiagnosticSeverity.Error,
                message: 'no field `taur` on type `&mut tauri::Config`',
                range: new vscode.Range(96, 9, 96, 13),
                source: 'rustc',
                relatedInformation: [
                    {
                        location: {
                            uri: testDocUri,
                            range: new vscode.Range(90, 1, 92, 13),
                        },
                        message: 'a field with a similar name exists: `tauri`',
                    },
                ],
            },
        ];
        const codeAction = new fixup_1.FixupCodeAction();
        const prompt = await codeAction.getCodeActionInstruction('         .taur', diagnostics);
        (0, vitest_1.expect)(prompt).toMatchSnapshot();
    });
});
