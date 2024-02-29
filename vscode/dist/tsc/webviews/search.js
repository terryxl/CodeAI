"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = __importDefault(require("react"));
const client_1 = __importDefault(require("react-dom/client"));
const SearchPanel_1 = require("./SearchPanel");
require("./index.css");
const VSCodeApi_1 = require("./utils/VSCodeApi");
client_1.default.createRoot(document.querySelector('#root')).render((0, jsx_runtime_1.jsx)(react_1.default.StrictMode, { children: (0, jsx_runtime_1.jsx)(SearchPanel_1.SearchPanel, { vscodeAPI: (0, VSCodeApi_1.getVSCodeAPI)() }) }));
