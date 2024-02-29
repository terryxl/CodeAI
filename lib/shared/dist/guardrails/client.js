import { isError } from '../utils';
import { ConfigFeaturesSingleton } from '../sourcegraph-api/graphql/client';
export class SourcegraphGuardrailsClient {
    client;
    constructor(client) {
        this.client = client;
    }
    async searchAttribution(snippet) {
        // Short-circuit attribution search if turned off in site config.
        const configFeatures = await ConfigFeaturesSingleton.getInstance().getConfigFeatures();
        if (!configFeatures.attribution) {
            return new Error('Attribution search is turned off.');
        }
        const result = await this.client.searchAttribution(snippet);
        if (isError(result)) {
            return result;
        }
        return {
            limitHit: result.limitHit,
            repositories: result.nodes.map(repo => ({ name: repo.repositoryName })),
        };
    }
}
//# sourceMappingURL=client.js.map