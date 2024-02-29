"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PopupFrame = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const classnames_1 = __importDefault(require("classnames"));
const Popup_module_css_1 = __importDefault(require("./Popup.module.css"));
const Backdrop = ({ dismiss }) => {
    const handleKeyUp = (e) => {
        if (e.key === 'Escape') {
            dismiss();
        }
    };
    const handleClick = (e) => {
        e.stopPropagation();
        dismiss();
    };
    return ((0, jsx_runtime_1.jsx)("div", { className: Popup_module_css_1.default.backdrop, onClick: handleClick, onKeyUp: handleKeyUp, role: "presentation" }));
};
const PopupFrame = ({ actionButtons, classNames: extraClassNames, onDismiss, isOpen, children }) => {
    const handleKeyUp = (e) => {
        if (e.key === 'Escape') {
            e.stopPropagation();
            onDismiss();
        }
    };
    return (isOpen && ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsxs)("dialog", { open: true, className: (0, classnames_1.default)(Popup_module_css_1.default.popup, ...(extraClassNames || [])), onKeyUp: handleKeyUp, children: [(0, jsx_runtime_1.jsx)("div", { className: Popup_module_css_1.default.row, children: children }), actionButtons && ((0, jsx_runtime_1.jsx)("div", { className: (0, classnames_1.default)(Popup_module_css_1.default.actionButtonContainer, Popup_module_css_1.default.row), children: actionButtons }))] }), (0, jsx_runtime_1.jsx)("div", { className: Popup_module_css_1.default.pointyBit }), (0, jsx_runtime_1.jsx)(Backdrop, { dismiss: onDismiss })] })));
};
exports.PopupFrame = PopupFrame;
