"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileLink = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const cody_shared_1 = require("@sourcegraph/cody-shared");
const VSCodeApi_1 = require("../utils/VSCodeApi");
const FileLink_module_css_1 = __importDefault(require("./FileLink.module.css"));
const FileLink = ({ uri, range, source, repoName, title, revision, }) => {
    if (source === 'unified') {
        // This is a remote search result.
        const repoShortName = repoName?.slice(repoName.lastIndexOf('/') + 1);
        const pathToDisplay = `${repoShortName} ${title}`;
        const pathWithRange = range
            ? `${pathToDisplay}:${range.start.line + 1}-${range.end.line}`
            : pathToDisplay;
        const tooltip = `${repoName} @${revision}\nincluded via Search`;
        return ((0, jsx_runtime_1.jsx)("a", { href: uri.toString(), target: "_blank", rel: "noreferrer", title: tooltip, className: FileLink_module_css_1.default.linkButton, children: pathWithRange }));
    }
    // +1 because selection range starts at 0 but editor line number starts at 1
    const startLine = (range?.start.line ?? 0) + 1;
    const endLine = (range?.end.line ?? -1) + 1;
    const hasValidRange = startLine <= endLine;
    const pathToDisplay = `@${(0, cody_shared_1.displayPath)(uri)}`;
    const pathWithRange = hasValidRange ? `${pathToDisplay}:${startLine}-${endLine}` : pathToDisplay;
    const tooltip = source ? `${pathWithRange} included via ${source}` : pathWithRange;
    return ((0, jsx_runtime_1.jsx)("button", { className: FileLink_module_css_1.default.linkButton, type: "button", title: tooltip, onClick: () => {
            (0, VSCodeApi_1.getVSCodeAPI)().postMessage({ command: 'openFile', uri, range });
        }, children: pathWithRange }));
};
exports.FileLink = FileLink;
