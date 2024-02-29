/// <reference path="../../../src/fileUri.d.ts" />
import * as vscode from 'vscode';
import type { Configuration, ConfigurationWithAccessToken, SourcegraphBrowserCompletionsClient } from '@sourcegraph/cody-shared';
import type { SourcegraphNodeCompletionsClient } from '@sourcegraph/cody-shared/src/sourcegraph-api/completions/nodeClient';
import type { BfgRetriever } from './completions/context/retrievers/bfg/bfg-retriever';
import './editor/displayPathEnvInfo';
import { ExtensionApi } from './extension-api';
import type { LocalEmbeddingsConfig, LocalEmbeddingsController } from './local-context/local-embeddings';
import type { SymfRunner } from './local-context/symf';
import type { OpenTelemetryService } from './services/open-telemetry/OpenTelemetryService.node';
import { type SentryService } from './services/sentry/sentry';
import type { CommandsProvider } from './commands/services/provider';
type Constructor<T extends new (...args: any) => any> = T extends new (...args: infer A) => infer R ? (...args: A) => R : never;
export interface PlatformContext {
    createCommandsProvider?: Constructor<typeof CommandsProvider>;
    createLocalEmbeddingsController?: (config: LocalEmbeddingsConfig) => LocalEmbeddingsController;
    createSymfRunner?: Constructor<typeof SymfRunner>;
    createBfgRetriever?: () => BfgRetriever;
    createCompletionsClient: Constructor<typeof SourcegraphBrowserCompletionsClient> | Constructor<typeof SourcegraphNodeCompletionsClient>;
    createSentryService?: (config: Pick<ConfigurationWithAccessToken, 'serverEndpoint'>) => SentryService;
    createOpenTelemetryService?: (config: Pick<ConfigurationWithAccessToken, 'serverEndpoint' | 'experimentalTracing'>) => OpenTelemetryService;
    onConfigurationChange?: (configuration: Configuration) => void;
}
export declare function activate(context: vscode.ExtensionContext, platformContext: PlatformContext): Promise<ExtensionApi>;
export {};
//# sourceMappingURL=extension.common.d.ts.map