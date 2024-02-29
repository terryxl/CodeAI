/// <reference types="node" />
import http from 'http';
import type { Configuration } from '@sourcegraph/cody-shared';
export declare function setCustomAgent(configuration: Configuration): ({ protocol }: Pick<URL, 'protocol'>) => http.Agent;
export declare function initializeNetworkAgent(): void;
//# sourceMappingURL=fetch.node.d.ts.map