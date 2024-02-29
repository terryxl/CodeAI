"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Notice = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const react_2 = require("@vscode/webview-ui-toolkit/react");
const classnames_1 = __importDefault(require("classnames"));
const Notice_module_css_1 = __importDefault(require("./Notice.module.css"));
/**
 * Renders notices component with icon, title, optional link, and dismiss button.
 * Handles dismissing state using localstorage based on the given dismissKey.
 * Dismiss behavior can be overridden by passing an onDismiss callback.
 */
const Notice = ({ icon, title, text, linkText, linkHref, linkTarget, onDismiss, dismissKey, className, }) => {
    const [dismissed, setDismissed] = (0, react_1.useState)((dismissKey && hasBeenDismissed(dismissKey)) || false);
    const defaultOnDismiss = (0, react_1.useCallback)(() => {
        if (dismissKey) {
            setHasBeenDismissed(dismissKey);
            setDismissed(true);
        }
    }, [dismissKey]);
    if (dismissed) {
        return undefined;
    }
    return ((0, jsx_runtime_1.jsxs)("div", { className: (0, classnames_1.default)(Notice_module_css_1.default.notice, className), children: [(0, jsx_runtime_1.jsx)("div", { className: Notice_module_css_1.default.noticeIcon, children: icon }), (0, jsx_runtime_1.jsxs)("div", { className: Notice_module_css_1.default.noticeText, children: [(0, jsx_runtime_1.jsx)("h1", { children: title }), text && (0, jsx_runtime_1.jsx)("p", { children: text }), linkText && linkHref && ((0, jsx_runtime_1.jsx)("p", { children: (0, jsx_runtime_1.jsx)(react_2.VSCodeLink, { href: linkHref, target: linkTarget, children: linkText }) }))] }), (0, jsx_runtime_1.jsx)("div", { className: Notice_module_css_1.default.noticeClose, children: (0, jsx_runtime_1.jsx)(react_2.VSCodeButton, { appearance: "icon", onClick: onDismiss || defaultOnDismiss, children: (0, jsx_runtime_1.jsx)("i", { className: "codicon codicon-close" }) }) })] }));
};
exports.Notice = Notice;
const storageKey = (key) => `notices.dismissed.${key}`;
const hasBeenDismissed = (key) => localStorage.getItem(storageKey(key)) === 'true';
const setHasBeenDismissed = (key) => localStorage.setItem(storageKey(key), 'true');
