import type { URI } from 'vscode-uri';
import type { ActiveTextEditorDiagnostic } from '../editor';
export declare function populateCodeContextTemplate(code: string, fileUri: URI, repoName?: string, type?: 'chat' | 'edit'): string;
export declare function populatePreciseCodeContextTemplate(symbol: string, fileUri: URI, code: string): string;
export declare function populateMarkdownContextTemplate(markdown: string, fileUri: URI, repoName?: string): string;
export declare function populateCurrentEditorContextTemplate(code: string, fileUri: URI, repoName?: string): string;
export declare function populateCurrentEditorSelectedContextTemplate(code: string, fileUri: URI, repoName?: string): string;
export declare function populateCurrentEditorDiagnosticsTemplate({ message, type, text }: ActiveTextEditorDiagnostic, fileUri: URI): string;
export declare function populateTerminalOutputContextTemplate(output: string): string;
export declare function populateCurrentSelectedCodeContextTemplate(code: string, fileUri: URI, repoName?: string): string;
export declare function populateListOfFilesContextTemplate(fileList: string, fileUri?: URI): string;
export declare function populateContextTemplateFromText(templateText: string, content: string, fileUri: URI): string;
export declare function populateImportListContextTemplate(importList: string, fileUri: URI): string;
export declare function populateCodeGenerationContextTemplate(precedingText: string, followingText: string, fileUri: URI, tag: string): string;
//# sourceMappingURL=templates.d.ts.map