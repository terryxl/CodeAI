import type { SourcegraphGraphQLAPIClient } from '../sourcegraph-api/graphql';
import type { Attribution, Guardrails } from '.';
export declare class SourcegraphGuardrailsClient implements Guardrails {
    private client;
    constructor(client: SourcegraphGraphQLAPIClient);
    searchAttribution(snippet: string): Promise<Attribution | Error>;
}
//# sourceMappingURL=client.d.ts.map