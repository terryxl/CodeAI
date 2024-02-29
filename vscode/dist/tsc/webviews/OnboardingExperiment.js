"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoginSimplified = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("@vscode/webview-ui-toolkit/react");
const cody_onboarding_splash_svg_1 = __importDefault(require("./cody-onboarding-splash.svg"));
const sign_in_logo_github_svg_1 = __importDefault(require("./sign-in-logo-github.svg"));
const sign_in_logo_gitlab_svg_1 = __importDefault(require("./sign-in-logo-gitlab.svg"));
const sign_in_logo_google_svg_1 = __importDefault(require("./sign-in-logo-google.svg"));
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
    return ((0, jsx_runtime_1.jsxs)("div", { className: OnboardingExperiment_module_css_1.default.container, children: [(0, jsx_runtime_1.jsxs)("div", { className: OnboardingExperiment_module_css_1.default.sectionsContainer, children: [(0, jsx_runtime_1.jsx)("img", { src: cody_onboarding_splash_svg_1.default, alt: "Hi, I'm Cody", className: OnboardingExperiment_module_css_1.default.logo }), (0, jsx_runtime_1.jsxs)("div", { className: OnboardingExperiment_module_css_1.default.section, children: [(0, jsx_runtime_1.jsx)("h1", { children: "Cody Free or Cody Pro" }), (0, jsx_runtime_1.jsx)("div", { className: OnboardingExperiment_module_css_1.default.buttonWidthSizer, children: (0, jsx_runtime_1.jsx)("div", { className: OnboardingExperiment_module_css_1.default.buttonStack, children: uiKindIsWeb ? ((0, jsx_runtime_1.jsx)(WebLogin, { telemetryService: telemetryService, vscodeAPI: vscodeAPI })) : ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsxs)(react_1.VSCodeButton, { className: OnboardingExperiment_module_css_1.default.button, type: "button", onClick: () => {
                                                    telemetryService.log('CodyVSCodeExtension:auth:simplifiedSignInGitHubClick');
                                                    simplifiedLoginRedirect('github');
                                                }, children: [(0, jsx_runtime_1.jsx)("img", { src: sign_in_logo_github_svg_1.default, alt: "GitHub logo" }), "Sign In with GitHub"] }), (0, jsx_runtime_1.jsxs)(react_1.VSCodeButton, { className: OnboardingExperiment_module_css_1.default.button, type: "button", onClick: () => {
                                                    telemetryService.log('CodyVSCodeExtension:auth:simplifiedSignInGitLabClick');
                                                    simplifiedLoginRedirect('gitlab');
                                                }, children: [(0, jsx_runtime_1.jsx)("img", { src: sign_in_logo_gitlab_svg_1.default, alt: "GitLab logo" }), "Sign In with GitLab"] }), (0, jsx_runtime_1.jsxs)(react_1.VSCodeButton, { className: OnboardingExperiment_module_css_1.default.button, type: "button", onClick: () => {
                                                    telemetryService.log('CodyVSCodeExtension:auth:simplifiedSignInGoogleClick');
                                                    simplifiedLoginRedirect('google');
                                                }, children: [(0, jsx_runtime_1.jsx)("img", { src: sign_in_logo_google_svg_1.default, alt: "Google logo" }), "Sign In with Google"] })] })) }) })] }), (0, jsx_runtime_1.jsxs)("div", { className: OnboardingExperiment_module_css_1.default.section, children: [(0, jsx_runtime_1.jsx)("h1", { children: "Cody Enterprise" }), (0, jsx_runtime_1.jsx)("div", { className: OnboardingExperiment_module_css_1.default.buttonWidthSizer, children: (0, jsx_runtime_1.jsx)("div", { className: OnboardingExperiment_module_css_1.default.buttonStack, children: (0, jsx_runtime_1.jsx)(react_1.VSCodeButton, { className: OnboardingExperiment_module_css_1.default.button, type: "button", onClick: otherSignInClick, children: "Sign In to Your Enterprise\u00A0Instance" }) }) }), (0, jsx_runtime_1.jsxs)("p", { children: ["Learn more about", ' ', (0, jsx_runtime_1.jsx)("a", { href: "https://sourcegraph.com/cloud", children: "Sourcegraph Enterprise" })] })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: OnboardingExperiment_module_css_1.default.terms, children: ["By signing in to Cody you agree to our", ' ', (0, jsx_runtime_1.jsx)("a", { href: "https://about.sourcegraph.com/terms", children: "Terms of Service" }), " and", ' ', (0, jsx_runtime_1.jsx)("a", { href: "https://about.sourcegraph.com/terms/privacy", children: "Privacy Policy" })] })] }));
};
exports.LoginSimplified = LoginSimplified;
