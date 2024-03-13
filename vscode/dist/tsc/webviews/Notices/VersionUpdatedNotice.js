"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VersionUpdatedNotice = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const package_json_1 = require("../../package.json");
const release_1 = require("../../src/release");
const Notice_1 = require("./Notice");
const VersionUpdatedNotice_module_css_1 = __importDefault(require("./VersionUpdatedNotice.module.css"));
const key = 'notices.last-dismissed-version';
/**
 * Handles the logic of whether to show the latest version notice, and a
 * callback function for setting it as being dismissed.
 *
 * The first time this is run on a fresh install, we consider the version
 * update as being dismissed.
 */
const useShowNotice = (currentVersion, probablyNewInstall) => {
    /* If this is a new install, we consider the current version dismissed already */
    if (probablyNewInstall) {
        localStorage.setItem(key, currentVersion);
    }
    const [showNotice, setShowNotice] = (0, react_1.useState)(
    /* Version different to what's already dismissed means time for a notice */
    localStorage.getItem(key) !== null && localStorage.getItem(key) !== currentVersion);
    const setDismissed = () => {
        localStorage.setItem(key, currentVersion);
        setShowNotice(false);
    };
    return [showNotice, setDismissed];
};
const VersionUpdatedNotice = ({ probablyNewInstall, }) => {
    const [showNotice, setDismissed] = useShowNotice((0, release_1.majorMinorVersion)(package_json_1.version), probablyNewInstall);
    if (!showNotice) {
        return undefined;
    }
    return ((0, jsx_runtime_1.jsx)(Notice_1.Notice, { icon: (0, jsx_runtime_1.jsx)(Icon, {}), title: `Cody updated to v${(0, release_1.majorMinorVersion)(package_json_1.version)}`, linkHref: (0, release_1.releaseNotesURL)(package_json_1.version), linkText: "See what\u2019s new\u00A0\u2192", linkTarget: "_blank", onDismiss: setDismissed }));
};
exports.VersionUpdatedNotice = VersionUpdatedNotice;
const Icon = () => ((0, jsx_runtime_1.jsxs)("svg", { className: VersionUpdatedNotice_module_css_1.default.icon, width: "24", height: "24", viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg", "aria-hidden": true, children: [(0, jsx_runtime_1.jsx)("path", { d: "M10.3714 9.37143L9 14L7.62857 9.37143L3 8L7.62857 6.62857L9 2L10.3714 6.62857L15 8L10.3714 9.37143Z" }), (0, jsx_runtime_1.jsx)("path", { d: "M21 12L17 14.2L13 12L15.2 16L13 20L17 17.8L21 20L18.8 16L21 12Z" }), (0, jsx_runtime_1.jsx)("path", { d: "M8.3 19L10 16L7 17.7L4 16L5.7 19L4 22L7 20.3L10 22L8.3 19Z" })] }));
