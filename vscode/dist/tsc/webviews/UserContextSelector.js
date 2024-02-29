"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserContextSelectorComponent = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = __importStar(require("react"));
const classnames_1 = __importDefault(require("classnames"));
const cody_shared_1 = require("@sourcegraph/cody-shared");
const UserContextSelector_module_css_1 = __importDefault(require("./UserContextSelector.module.css"));
const STARTER = 'Search for a file to include, or type # to search symbols...';
const FILE_ON_RESULT = 'Search for a file to include...';
const FILE_NO_RESULT = 'No matching files found';
const SYMBOL_ON_RESULT = 'Search for a symbol to include...';
const SYMBOL_NO_RESULT = 'No matching symbols found';
const UserContextSelectorComponent = ({ onSelected, contextSelection, formInput, selected, setSelectedChatContext, contextQuery }) => {
    const selectionRef = (0, react_1.useRef)(null);
    // biome-ignore lint/correctness/useExhaustiveDependencies: we want this to refresh
    (0, react_1.useEffect)(() => {
        const container = selectionRef.current;
        if (container) {
            container.scrollIntoView({ block: 'nearest' });
        }
    }, [selected]);
    (0, react_1.useEffect)(() => {
        // Set the selected context to the first item whenever the contextSelection changes
        if (contextSelection?.length) {
            setSelectedChatContext(0);
        }
    }, [contextSelection?.length, setSelectedChatContext]);
    const headingTitle = (0, react_1.useMemo)(() => {
        if (!contextQuery.length) {
            return STARTER; // for empty query
        }
        const noResult = !contextSelection?.length;
        const isSymbolQuery = contextQuery.startsWith('#');
        if (!isSymbolQuery) {
            return noResult ? FILE_NO_RESULT : FILE_ON_RESULT;
        }
        // for empty symbol query or with symbol results
        if (contextQuery.endsWith('#') || !noResult) {
            return SYMBOL_ON_RESULT;
        }
        return SYMBOL_NO_RESULT;
    }, [contextQuery, contextSelection?.length]);
    if (contextSelection === null || selected === -1) {
        return null;
    }
    // If the query ENDS with a non-alphanumeric character (except #),
    // ex. '@abcdefg?' -> false & '@abcdefg?file' -> false
    // and there is no contextSelection to display,
    // don't display the selector.
    if (/[^a-zA-Z0-9#]$/.test(contextQuery)) {
        if (!contextSelection?.length) {
            return null;
        }
    }
    return ((0, jsx_runtime_1.jsxs)("div", { className: (0, classnames_1.default)(UserContextSelector_module_css_1.default.container), children: [headingTitle ? ((0, jsx_runtime_1.jsx)("div", { className: (0, classnames_1.default)(UserContextSelector_module_css_1.default.headingContainer), children: (0, jsx_runtime_1.jsx)("h3", { className: UserContextSelector_module_css_1.default.heading, children: headingTitle }) })) : null, formInput.match(/@#.{1,2}$/) && !contextSelection?.length ? ((0, jsx_runtime_1.jsxs)("p", { className: UserContextSelector_module_css_1.default.emptySymbolSearchTip, children: [(0, jsx_runtime_1.jsx)("i", { className: "codicon codicon-info" }), " VS Code may require you to open files and install language extensions for accurate results"] })) : null, contextSelection?.length ? ((0, jsx_runtime_1.jsx)("div", { className: (0, classnames_1.default)(UserContextSelector_module_css_1.default.selectionsContainer), children: contextSelection?.map((match, i) => {
                    const icon = match.type === 'file'
                        ? null
                        : match.kind === 'class'
                            ? 'symbol-structure'
                            : 'symbol-method';
                    const title = match.type === 'file' ? (0, cody_shared_1.displayPath)(match.uri) : match.symbolName;
                    const range = match.range
                        ? `:${match.range.start.line + 1}-${match.range.end.line + 1}`
                        : '';
                    const description = match.type === 'file' ? undefined : (0, cody_shared_1.displayPath)(match.uri) + range;
                    const warning = match.type === 'file' && match.title === 'large-file'
                        ? 'File too large. Type @# to choose a symbol'
                        : undefined;
                    return ((0, jsx_runtime_1.jsx)(react_1.default.Fragment, { children: (0, jsx_runtime_1.jsxs)("button", { ref: selected === i ? selectionRef : null, className: (0, classnames_1.default)(UserContextSelector_module_css_1.default.selectionItem, selected === i && UserContextSelector_module_css_1.default.selected, warning && UserContextSelector_module_css_1.default.showWarning), title: title, onClick: () => onSelected(match, formInput), type: "button", children: [match.type === 'symbol' && icon && ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)("i", { className: `codicon codicon-${icon}`, title: match.kind }), ' '] })), (0, jsx_runtime_1.jsxs)("span", { className: UserContextSelector_module_css_1.default.titleAndDescriptionContainer, children: [(0, jsx_runtime_1.jsx)("span", { className: UserContextSelector_module_css_1.default.selectionTitle, children: title }), description && ((0, jsx_runtime_1.jsx)("span", { className: UserContextSelector_module_css_1.default.selectionDescription, children: description }))] }), warning && ((0, jsx_runtime_1.jsx)("p", { className: (0, classnames_1.default)(UserContextSelector_module_css_1.default.titleAndDescriptionContainer, UserContextSelector_module_css_1.default.warningContainer), children: (0, jsx_runtime_1.jsx)("span", { className: UserContextSelector_module_css_1.default.warningDescription, children: warning }) }))] }) }, `${icon}${title}${range}${description}`));
                }) })) : null] }));
};
exports.UserContextSelectorComponent = UserContextSelectorComponent;
