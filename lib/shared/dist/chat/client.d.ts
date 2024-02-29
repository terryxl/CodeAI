import type { ConfigurationWithAccessToken } from '../configuration';
import { SourcegraphGraphQLAPIClient } from '../sourcegraph-api/graphql';
import { Transcript } from './transcript';
import type { ChatMessage } from './transcript/messages';
type ClientInitConfig = Pick<ConfigurationWithAccessToken, 'serverEndpoint' | 'codebase' | 'useContext' | 'accessToken' | 'customHeaders'>;
interface ClientInit {
    config: ClientInitConfig;
    setMessageInProgress: (messageInProgress: ChatMessage | null) => void;
    setTranscript: (transcript: Transcript) => void;
    initialTranscript?: Transcript;
}
export interface Client {
    readonly transcript: Transcript;
    reset: () => void;
    sourcegraphStatus: {
        authenticated: boolean;
        version: string;
    };
    codyStatus: {
        enabled: boolean;
        version: string;
    };
    graphqlClient: SourcegraphGraphQLAPIClient;
}
export declare function createClient({ config, setMessageInProgress, setTranscript, initialTranscript, }: ClientInit): Promise<Client | null>;
export {};
//# sourceMappingURL=client.d.ts.map