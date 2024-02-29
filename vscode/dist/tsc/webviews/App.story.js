"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Simple = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const protocol_1 = require("../src/chat/protocol");
const App_1 = require("./App");
const VSCodeStoryDecorator_1 = require("./storybook/VSCodeStoryDecorator");
const meta = {
    title: 'cody/App',
    component: App_1.App,
    decorators: [VSCodeStoryDecorator_1.VSCodeStoryDecorator],
};
exports.default = meta;
exports.Simple = {
    render: () => ((0, jsx_runtime_1.jsx)("div", { style: { background: 'rgb(28, 33, 40)' }, children: (0, jsx_runtime_1.jsx)(App_1.App, { vscodeAPI: dummyVSCodeAPI }) })),
};
const dummyVSCodeAPI = {
    onMessage: cb => {
        // Send initial message so that the component is fully rendered.
        cb({
            type: 'config',
            config: {
                debugEnable: true,
                serverEndpoint: 'https://example.com',
                os: 'linux',
                arch: 'x64',
                homeDir: '/home/user',
                uiKindIsWeb: false,
                extensionVersion: '0.0.0',
                experimentalGuardrails: false,
            },
            authStatus: {
                ...protocol_1.defaultAuthStatus,
                isLoggedIn: true,
                authenticated: true,
                hasVerifiedEmail: true,
                requiresVerifiedEmail: false,
                siteHasCodyEnabled: true,
                siteVersion: '5.1.0',
                endpoint: 'https://example.com',
            },
            workspaceFolderUris: [],
        });
        return () => { };
    },
    postMessage: () => { },
    getState: () => ({}),
    setState: () => { },
};
