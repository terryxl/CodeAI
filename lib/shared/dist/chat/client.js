import { SourcegraphGraphQLAPIClient } from '../sourcegraph-api/graphql';
import { isError } from '../utils';
import { Transcript } from './transcript';
export async function createClient({ config, setMessageInProgress, setTranscript, initialTranscript, }) {
    const fullConfig = { debugEnable: false, ...config };
    const graphqlClient = new SourcegraphGraphQLAPIClient(fullConfig);
    const sourcegraphVersion = await graphqlClient.getSiteVersion();
    const sourcegraphStatus = { authenticated: false, version: '' };
    if (!isError(sourcegraphVersion)) {
        sourcegraphStatus.authenticated = true;
        sourcegraphStatus.version = sourcegraphVersion;
    }
    const codyStatus = await graphqlClient.isCodyEnabled();
    if (sourcegraphStatus.authenticated && codyStatus.enabled) {
        const transcript = initialTranscript || new Transcript();
        let isMessageInProgress = false;
        const sendTranscript = (data) => {
            if (isMessageInProgress) {
                const messages = transcript.toChat();
                setTranscript(transcript);
                const message = messages.at(-1);
                if (data) {
                    message.data = data;
                }
                setMessageInProgress(message);
            }
            else {
                setTranscript(transcript);
                if (data) {
                    setMessageInProgress({ data, speaker: 'assistant' });
                }
                else {
                    setMessageInProgress(null);
                }
            }
        };
        return {
            get transcript() {
                return transcript;
            },
            reset() {
                isMessageInProgress = false;
                transcript.reset();
                sendTranscript();
            },
            sourcegraphStatus,
            codyStatus,
            graphqlClient,
        };
    }
    return null;
}
//# sourceMappingURL=client.js.map