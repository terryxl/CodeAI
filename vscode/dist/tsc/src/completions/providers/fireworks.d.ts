import { type AutocompleteTimeouts, type CodeCompletionsClient, type ConfigurationWithAccessToken } from '@sourcegraph/cody-shared';
import { type ProviderConfig } from './provider';
import type { AuthStatus } from '../../chat/protocol';
export interface FireworksOptions {
    model: FireworksModel;
    maxContextTokens?: number;
    client: CodeCompletionsClient;
    timeouts: AutocompleteTimeouts;
    config: Pick<ConfigurationWithAccessToken, 'accessToken'>;
    authStatus: Pick<AuthStatus, 'userCanUpgrade' | 'isDotCom' | 'endpoint'>;
}
declare const MODEL_MAP: {
    starcoder: string;
    'starcoder-16b': string;
    'starcoder-7b': string;
    'llama-code-13b': string;
};
type FireworksModel = keyof typeof MODEL_MAP | 'starcoder-hybrid';
export declare function createProviderConfig({ model, timeouts, ...otherOptions }: Omit<FireworksOptions, 'model' | 'maxContextTokens'> & {
    model: string | null;
}): ProviderConfig;
export {};
//# sourceMappingURL=fireworks.d.ts.map