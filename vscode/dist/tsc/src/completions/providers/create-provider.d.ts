import { type CodeCompletionsClient, type ConfigurationWithAccessToken } from '@sourcegraph/cody-shared';
import type { ProviderConfig } from './provider';
import type { AuthStatus } from '../../chat/protocol';
export declare function createProviderConfig(config: ConfigurationWithAccessToken, client: CodeCompletionsClient, authStatus: AuthStatus): Promise<ProviderConfig | null>;
//# sourceMappingURL=create-provider.d.ts.map