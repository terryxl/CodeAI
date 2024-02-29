"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeNetworkAgent = exports.setCustomAgent = void 0;
const http_1 = __importDefault(require("http"));
const https_1 = __importDefault(require("https"));
const socks_proxy_agent_1 = require("socks-proxy-agent");
const configuration_1 = require("./configuration");
const fetch_1 = require("./fetch");
// The path to the exported class can be found in the npm contents
// https://www.npmjs.com/package/@vscode/proxy-agent?activeTab=code
const nodeModules = '_VSCODE_NODE_MODULES';
const proxyAgentPath = '@vscode/proxy-agent/out/agent';
const pacProxyAgent = 'PacProxyAgent';
/**
 * We use keepAlive agents here to avoid excessive SSL/TLS handshakes for autocomplete requests.
 */
const httpAgent = new http_1.default.Agent({ keepAlive: true, keepAliveMsecs: 60000 });
const httpsAgent = new https_1.default.Agent({ keepAlive: true, keepAliveMsecs: 60000 });
let socksProxyAgent;
function getCustomAgent({ proxy }) {
    return ({ protocol }) => {
        if (proxy?.startsWith('socks') && !socksProxyAgent) {
            socksProxyAgent = new socks_proxy_agent_1.SocksProxyAgent(proxy, {
                keepAlive: true,
                keepAliveMsecs: 60000,
            });
            return socksProxyAgent;
        }
        if (protocol === 'http:') {
            return httpAgent;
        }
        return httpsAgent;
    };
}
function setCustomAgent(configuration) {
    fetch_1.agent.current = getCustomAgent(configuration);
    return fetch_1.agent.current;
}
exports.setCustomAgent = setCustomAgent;
function initializeNetworkAgent() {
    const customAgent = setCustomAgent((0, configuration_1.getConfiguration)());
    /**
     * This works around an issue in the default VS Code proxy agent code. When `http.proxySupport`
     * is set to its default value and no proxy setting is being used, the proxy library does not
     * properly reuse the agent set on the http(s) method and is instead always using a new agent
     * per request.
     *
     * To work around this, we patch the default proxy agent method and overwrite the
     * `originalAgent` value before invoking it for requests that want to keep their connection
     * alive (as indicated by the `Connection: keep-alive` header).
     *
     * c.f. https://github.com/microsoft/vscode/issues/173861
     */
    try {
        const PacProxyAgent = globalThis?.[nodeModules]?.[proxyAgentPath]?.[pacProxyAgent] ?? undefined;
        if (PacProxyAgent) {
            const originalConnect = PacProxyAgent.prototype.connect;
            // Patches the implementation defined here:
            // https://github.com/microsoft/vscode-proxy-agent/blob/d340b9d34684da494d6ebde3bcd18490a8bbd071/src/agent.ts#L53
            PacProxyAgent.prototype.connect = function (req, opts) {
                try {
                    const connectionHeader = req.getHeader('connection');
                    if (connectionHeader === 'keep-alive' ||
                        (Array.isArray(connectionHeader) && connectionHeader.includes('keep-alive'))) {
                        this.opts.originalAgent = customAgent(opts);
                        return originalConnect.call(this, req, opts);
                    }
                    return originalConnect.call(this, req, opts);
                }
                catch {
                    return originalConnect.call(this, req, opts);
                }
            };
        }
    }
    catch (error) {
        // Ignore any errors in the patching logic
        void error;
    }
}
exports.initializeNetworkAgent = initializeNetworkAgent;
