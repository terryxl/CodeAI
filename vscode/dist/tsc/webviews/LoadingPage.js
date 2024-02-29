"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoadingPage = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const LoadingPage_module_css_1 = __importDefault(require("./LoadingPage.module.css"));
const LoadingPage = () => ((0, jsx_runtime_1.jsx)("div", { className: "outer-container", children: (0, jsx_runtime_1.jsx)("div", { className: LoadingPage_module_css_1.default.container, children: (0, jsx_runtime_1.jsx)(LoadingDots, {}) }) }));
exports.LoadingPage = LoadingPage;
const LoadingDots = () => ((0, jsx_runtime_1.jsxs)("div", { className: LoadingPage_module_css_1.default.dotsHolder, children: [(0, jsx_runtime_1.jsx)("div", { className: LoadingPage_module_css_1.default.dot }), (0, jsx_runtime_1.jsx)("div", { className: LoadingPage_module_css_1.default.dot }), (0, jsx_runtime_1.jsx)("div", { className: LoadingPage_module_css_1.default.dot })] }));
