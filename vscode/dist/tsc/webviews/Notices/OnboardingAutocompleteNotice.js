"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OnboardingAutocompleteNotice = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const VSCodeApi_1 = require("../utils/VSCodeApi");
const Notice_1 = require("./Notice");
const OnboardingAutocompleteNotice_module_css_1 = __importDefault(require("./OnboardingAutocompleteNotice.module.css"));
const OnboardingAutocompleteNotice = () => {
    const [showNotice, setShowNotice] = (0, react_1.useState)(false);
    // On first render we set up a listener for messages from ChatViewProvider
    (0, react_1.useEffect)(() => {
        const cleanup = (0, VSCodeApi_1.getVSCodeAPI)().onMessage(message => {
            if (message.type === 'notice' && message.notice.key === 'onboarding-autocomplete') {
                setShowNotice(true);
            }
        });
        return () => {
            cleanup();
        };
    }, []);
    if (!showNotice) {
        return undefined;
    }
    return ((0, jsx_runtime_1.jsx)(Notice_1.Notice, { icon: (0, jsx_runtime_1.jsx)(Icon, {}), title: "Congratulations! You just accepted your first Cody autocomplete.", linkText: "Next: Run a Command \u2192", linkHref: "command:cody.menu.commands", dismissKey: "onboarding-autocomplete", className: "onboarding-autocomplete" }));
};
exports.OnboardingAutocompleteNotice = OnboardingAutocompleteNotice;
const Icon = () => ((0, jsx_runtime_1.jsxs)("svg", { className: OnboardingAutocompleteNotice_module_css_1.default.icon, width: "24", height: "24", viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg", "aria-hidden": true, children: [(0, jsx_runtime_1.jsx)("path", { d: "M18.09 11.77L19.56 18.1L14 14.74L8.44 18.1L9.9 11.77L5 7.5L11.47 6.96L14 1L16.53 6.96L23 7.5L18.09 11.77Z", opacity: "0.9" }), (0, jsx_runtime_1.jsxs)("g", { className: OnboardingAutocompleteNotice_module_css_1.default.trails, children: [(0, jsx_runtime_1.jsx)("path", { d: "M1.15997 21.5505C1.35997 21.8405 1.67997 22.0005 1.99997 22.0005C2.18997 22.0005 2.37997 21.9505 2.54997 21.8405L6.65997 19.1305L6.99997 17.7605L7.30997 16.3105L1.44997 20.1605C0.988972 20.4705 0.860972 21.0905 1.15997 21.5505Z" }), (0, jsx_runtime_1.jsx)("path", { d: "M1.15997 16.76C0.860972 16.3 0.988972 15.68 1.44997 15.38L7.31997 11.5L8.23997 12.31L7.96997 13.5L2.54997 17.05C2.37997 17.16 2.18997 17.21 1.99997 17.21C1.67997 17.21 1.35997 17.06 1.15997 16.76Z" }), (0, jsx_runtime_1.jsx)("path", { d: "M2.54997 12.2591C2.37997 12.3691 2.18997 12.4291 1.99997 12.4291C1.67997 12.4291 1.35997 12.2691 1.15997 11.9991C0.860972 11.4991 0.988972 10.8891 1.44997 10.5891L4.17997 8.78906L5.74997 10.1491L2.54997 12.2591Z" })] })] }));
