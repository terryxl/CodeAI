/// <reference types="node" />
import type { Agent } from 'http';
import { type BrowserOrNodeResponse } from '@sourcegraph/cody-shared';
/**
 * In node environments, it might be necessary to set up a custom agent to control the network
 * requests being made.
 *
 * To do this, we have a mutable agent variable that can be set to an instance of `http.Agent` or
 * `https.Agent` (depending on the protocol of the URL) but that will be kept undefined for web
 * environments.
 *
 * Agent is a mutable ref so that we can override it from `fetch.node.ts`
 */
export declare const agent: {
    current: ((url: URL) => Agent) | undefined;
};
export declare function fetch(input: RequestInfo | URL, init?: RequestInit): Promise<BrowserOrNodeResponse>;
//# sourceMappingURL=fetch.d.ts.map