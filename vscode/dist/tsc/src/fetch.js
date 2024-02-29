"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetch = exports.agent = void 0;
/**
 * By hard-requiring isomorphic-fetch, we ensure that even in newer Node environments that include
 * `fetch` by default, we still use the `node-fetch` polyfill and have access to the networking code
 */
const isomorphic_fetch_1 = __importDefault(require("isomorphic-fetch"));
const cody_shared_1 = require("@sourcegraph/cody-shared");
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
exports.agent = { current: undefined };
function fetch(input, init) {
    if (cody_shared_1.customUserAgent) {
        init = init ?? {};
        const headers = new Headers(init?.headers);
        (0, cody_shared_1.addCustomUserAgent)(headers);
        init.headers = headers;
    }
    const initWithAgent = {
        ...init,
        agent: exports.agent.current,
    };
    return (0, isomorphic_fetch_1.default)(input, initWithAgent);
}
exports.fetch = fetch;
