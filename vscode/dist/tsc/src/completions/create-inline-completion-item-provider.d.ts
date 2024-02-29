/// <reference path="../../../../src/fileUri.d.ts" />
import * as vscode from 'vscode';
import { type CodeCompletionsClient, type ConfigurationWithAccessToken } from '@sourcegraph/cody-shared';
import type { AuthProvider } from '../services/AuthProvider';
import type { CodyStatusBar } from '../services/StatusBar';
import type { BfgRetriever } from './context/retrievers/bfg/bfg-retriever';
interface InlineCompletionItemProviderArgs {
    config: ConfigurationWithAccessToken;
    client: CodeCompletionsClient;
    statusBar: CodyStatusBar;
    authProvider: AuthProvider;
    triggerNotice: ((notice: {
        key: string;
    }) => void) | null;
    createBfgRetriever?: () => BfgRetriever;
}
export declare function createInlineCompletionItemProvider({ config, client, statusBar, authProvider, triggerNotice, createBfgRetriever, }: InlineCompletionItemProviderArgs): Promise<vscode.Disposable>;
export declare function getInlineCompletionItemProviderFilters(autocompleteLanguages: Record<string, boolean>): Promise<vscode.DocumentFilter[]>;
export {};
//# sourceMappingURL=create-inline-completion-item-provider.d.ts.map