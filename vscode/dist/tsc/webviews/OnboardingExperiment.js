"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoginSimplified = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("@vscode/webview-ui-toolkit/react");
const OnboardingExperiment_module_css_1 = __importDefault(require("./OnboardingExperiment.module.css"));
const WebLogin = ({ telemetryService, vscodeAPI }) => {
    return ((0, jsx_runtime_1.jsxs)("ol", { children: [(0, jsx_runtime_1.jsx)("li", { children: (0, jsx_runtime_1.jsx)("a", { href: "https://sourcegraph.com/sign-up", target: "site", children: "Sign Up at Sourcegraph.com" }) }), (0, jsx_runtime_1.jsx)("li", { children: (0, jsx_runtime_1.jsx)("a", { href: "https://sourcegraph.com/user/settings/tokens", target: "site", children: "Generate an Access Token" }) }), (0, jsx_runtime_1.jsx)("li", { children: (0, jsx_runtime_1.jsx)("a", { href: "about:blank", onClick: event => {
                        telemetryService.log('CodyVSCodeExtension:auth:clickSignInWeb');
                        vscodeAPI.postMessage({
                            command: 'simplified-onboarding',
                            onboardingKind: 'web-sign-in-token',
                        });
                        event.preventDefault();
                        event.stopPropagation();
                    }, children: "Add the Access Token to VS Code" }) })] }));
};
// A login component which is simplified by not having an app setup flow.
const LoginSimplified = ({ simplifiedLoginRedirect, telemetryService, uiKindIsWeb, vscodeAPI, }) => {
    const otherSignInClick = () => {
        telemetryService.log('CodyVSCodeExtension:auth:clickOtherSignInOptions');
        vscodeAPI.postMessage({ command: 'auth', authKind: 'signin' });
    };
    return ((0, jsx_runtime_1.jsx)("div", { className: OnboardingExperiment_module_css_1.default.container, children: (0, jsx_runtime_1.jsx)("div", { className: OnboardingExperiment_module_css_1.default.sectionsContainer, children: (0, jsx_runtime_1.jsx)("div", { className: OnboardingExperiment_module_css_1.default.section, children: (0, jsx_runtime_1.jsx)("div", { className: OnboardingExperiment_module_css_1.default.buttonWidthSizer, children: (0, jsx_runtime_1.jsx)("div", { className: OnboardingExperiment_module_css_1.default.buttonStack, children: uiKindIsWeb ? ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)(WebLogin, { telemetryService: telemetryService, vscodeAPI: vscodeAPI }), (0, jsx_runtime_1.jsx)(react_1.VSCodeButton, { className: OnboardingExperiment_module_css_1.default.button, type: "button", onClick: otherSignInClick, children: "\u4F7F\u7528\u6D77\u5C14\u8D26\u53F7\u767B\u5F55" })] })) : ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)(WebLogin, { telemetryService: telemetryService, vscodeAPI: vscodeAPI }), (0, jsx_runtime_1.jsx)(react_1.VSCodeButton, { className: OnboardingExperiment_module_css_1.default.button, type: "button", onClick: otherSignInClick, children: "\u4F7F\u7528\u6D77\u5C14\u8D26\u53F7\u767B\u5F55" })] })) }) }) }) }) }));
};
exports.LoginSimplified = LoginSimplified;
