/// <reference path="../../../src/fileUri.d.ts" />
import type * as vscode from 'vscode';
import { ChatClient, type CodeCompletionsClient, type ConfigurationWithAccessToken, type Guardrails, type IntentDetector } from '@sourcegraph/cody-shared';
import type { PlatformContext } from './extension.common';
import type { LocalEmbeddingsConfig, LocalEmbeddingsController } from './local-context/local-embeddings';
import type { SymfRunner } from './local-context/symf';
interface ExternalServices {
    intentDetector: IntentDetector;
    chatClient: ChatClient;
    codeCompletionsClient: CodeCompletionsClient;
    guardrails: Guardrails;
    localEmbeddings: LocalEmbeddingsController | undefined;
    symfRunner: SymfRunner | undefined;
    /** Update configuration for all of the services in this interface. */
    onConfigurationChange: (newConfig: ExternalServicesConfiguration) => void;
}
type ExternalServicesConfiguration = Pick<ConfigurationWithAccessToken, 'serverEndpoint' | 'codebase' | 'useContext' | 'customHeaders' | 'accessToken' | 'debugEnable' | 'experimentalTracing'> & LocalEmbeddingsConfig;
export declare function configureExternalServices(context: vscode.ExtensionContext, initialConfig: ExternalServicesConfiguration, platform: Pick<PlatformContext, 'createLocalEmbeddingsController' | 'createCompletionsClient' | 'createSentryService' | 'createOpenTelemetryService' | 'createSymfRunner'>): Promise<ExternalServices>;
export {};
//# sourceMappingURL=external-services.d.ts.map