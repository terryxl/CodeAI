"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SymbolLink = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const VSCodeApi_1 = require("./utils/VSCodeApi");
const SymbolLink_module_css_1 = __importDefault(require("./SymbolLink.module.css"));
const SymbolLink = ({ symbol, path, range }) => ((0, jsx_runtime_1.jsx)("button", { className: SymbolLink_module_css_1.default.linkButton, type: "button", onClick: () => {
        (0, VSCodeApi_1.getVSCodeAPI)().postMessage({
            command: 'openLocalFileWithRange',
            filePath: path,
            range: {
                start: { line: range?.startLine ?? 0, character: range?.startCharacter ?? 0 },
                end: { line: range?.endLine ?? 0, character: range?.endCharacter ?? 0 },
            },
        });
    }, title: symbol, children: symbol }));
exports.SymbolLink = SymbolLink;
