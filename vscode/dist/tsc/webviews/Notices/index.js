"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Notices = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const OnboardingAutocompleteNotice_1 = require("./OnboardingAutocompleteNotice");
const VersionUpdatedNotice_1 = require("./VersionUpdatedNotice");
const index_module_css_1 = __importDefault(require("./index.module.css"));
const Notices = ({ probablyNewInstall }) => ((0, jsx_runtime_1.jsxs)("div", { className: index_module_css_1.default.notices, children: [(0, jsx_runtime_1.jsx)(VersionUpdatedNotice_1.VersionUpdatedNotice, { probablyNewInstall: probablyNewInstall }), (0, jsx_runtime_1.jsx)(OnboardingAutocompleteNotice_1.OnboardingAutocompleteNotice, {})] }));
exports.Notices = Notices;
