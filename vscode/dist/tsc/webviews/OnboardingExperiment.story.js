"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoginWeb = exports.Login = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const cody_shared_1 = require("@sourcegraph/cody-shared");
const OnboardingExperiment_1 = require("./OnboardingExperiment");
const VSCodeStoryDecorator_1 = require("./storybook/VSCodeStoryDecorator");
const meta = {
    title: 'cody/Onboarding',
    component: OnboardingExperiment_1.LoginSimplified,
    decorators: [VSCodeStoryDecorator_1.VSCodeStoryDecorator],
};
exports.default = meta;
const vscodeAPI = {
    postMessage: () => { },
    onMessage: () => () => { },
    getState: () => ({}),
    setState: () => { },
};
exports.Login = {
    render: () => ((0, jsx_runtime_1.jsx)("div", { style: { background: 'rgb(28, 33, 40)' }, children: (0, jsx_runtime_1.jsx)(OnboardingExperiment_1.LoginSimplified, { simplifiedLoginRedirect: () => { }, telemetryService: cody_shared_1.NOOP_TELEMETRY_SERVICE, uiKindIsWeb: false, vscodeAPI: vscodeAPI }) })),
};
exports.LoginWeb = {
    render: () => ((0, jsx_runtime_1.jsx)("div", { style: { background: 'rgb(28, 33, 40)' }, children: (0, jsx_runtime_1.jsx)(OnboardingExperiment_1.LoginSimplified, { simplifiedLoginRedirect: () => { }, telemetryService: cody_shared_1.NOOP_TELEMETRY_SERVICE, uiKindIsWeb: true, vscodeAPI: vscodeAPI }) })),
};
