import * as React from 'react';
import type { EnhancedContextContextT, LocalEmbeddingsProvider, LocalSearchProvider } from '@sourcegraph/cody-shared';
export declare enum EnhancedContextPresentationMode {
    Consumer = "consumer",
    Enterprise = "enterprise"
}
interface EnhancedContextSettingsProps {
    presentationMode: 'consumer' | 'enterprise';
    isOpen: boolean;
    setOpen: (open: boolean) => void;
}
export declare const EnhancedContextContext: React.Context<EnhancedContextContextT>;
export declare const EnhancedContextEventHandlers: React.Context<EnhancedContextEventHandlersT>;
export interface EnhancedContextEventHandlersT {
    onChooseRemoteSearchRepo: () => void;
    onConsentToEmbeddings: (provider: LocalEmbeddingsProvider) => void;
    onEnabledChange: (enabled: boolean) => void;
    onRemoveRemoteSearchRepo: (id: string) => void;
    onShouldBuildSymfIndex: (provider: LocalSearchProvider) => void;
}
export declare const EnhancedContextSettings: React.FunctionComponent<EnhancedContextSettingsProps>;
export {};
//# sourceMappingURL=EnhancedContextSettings.d.ts.map