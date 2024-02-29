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
exports.SearchPanel = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
/**
 * Disabling the following rule is necessary to be consistent with the behavior of the VS Code search
 * panel, which does not support tabbing through list items and requires using the arrow keys.
 */
const react_1 = __importStar(require("react"));
const lodash_1 = require("lodash");
const lru_cache_1 = require("lru-cache");
const cody_shared_1 = require("@sourcegraph/cody-shared");
const SearchPanel_module_css_1 = __importDefault(require("./SearchPanel.module.css"));
const displayPathEnvInfo_1 = require("./utils/displayPathEnvInfo");
const SEARCH_DEBOUNCE_MS = 400;
class ResultsCache {
    cache = new lru_cache_1.LRUCache({
        max: 100,
        ttl: 1000 * 60 * 60, // 1 hour
    });
    lastReset = 0;
    set(query, results, afterReset) {
        const curTime = Date.now();
        if (curTime - this.lastReset > afterReset) {
            this.cache.set(query, results);
        }
    }
    get(query) {
        return this.cache.get(query);
    }
    clear() {
        this.cache.clear();
        this.lastReset = Date.now();
    }
}
function doSearch(vscodeAPI, query, cache, cacheCallback) {
    if (query.length === 0) {
        return;
    }
    if (cache) {
        const cachedResults = cache.get(query);
        if (cachedResults && cacheCallback) {
            cacheCallback(cachedResults);
            return;
        }
    }
    vscodeAPI.postMessage({ command: 'search', query });
}
const debouncedDoSearch = (0, lodash_1.debounce)(doSearch, SEARCH_DEBOUNCE_MS);
const SearchPanel = ({ vscodeAPI }) => {
    const [query, setQuery] = react_1.default.useState('');
    const [searching, setSearching] = react_1.default.useState(false);
    const [results, setResults] = react_1.default.useState([]);
    const [selectedResult, setSelectedResult] = react_1.default.useState([-1, -1]);
    const [collapsedFileResults, setCollapsedFileResults] = react_1.default.useState({});
    const outerContainerRef = (0, react_1.useRef)(null);
    const queryInputRef = (0, react_1.useRef)(null);
    const resultsCache = (0, react_1.useMemo)(() => new ResultsCache(), []);
    // Update search results when query changes
    (0, react_1.useEffect)(() => {
        if (query.trim().length === 0) {
            setSearching(false);
            setResults([]);
            setSelectedResult([-1, -1]);
            return;
        }
        setSearching(true);
        debouncedDoSearch(vscodeAPI, query, resultsCache, cachedResults => {
            setSearching(false);
            setResults(cachedResults);
        });
    }, [vscodeAPI, resultsCache, query]);
    // update the search results when we get results from the extension backend
    (0, react_1.useEffect)(() => {
        return vscodeAPI.onMessage(message => {
            switch (message.type) {
                case 'update-search-results': {
                    if (message.query === query) {
                        setSearching(false);
                        setResults(message.results);
                        setSelectedResult([-1, -1]);
                    }
                    // hack: there is a chance the user request predates
                    // the last index update, so we add a 5 sec delay before
                    // we accept new entries into the cache
                    resultsCache.set(message.query, message.results, 5 * 1000);
                    break;
                }
                case 'index-updated': {
                    resultsCache.clear();
                    break;
                }
                case 'search:config':
                    (0, displayPathEnvInfo_1.updateDisplayPathEnvInfoForWebview)(message.workspaceFolderUris);
                    break;
            }
        });
    }, [vscodeAPI, resultsCache, query]);
    // When selection changes, send a message to the extension indicating the file and range
    (0, react_1.useEffect)(() => {
        if (selectedResult[0] === -1 || selectedResult[1] === -1) {
            return;
        }
        const selectedFile = results[selectedResult[0]];
        const selectedSnippet = selectedFile.snippets[selectedResult[1]];
        vscodeAPI.postMessage({
            command: 'show-search-result',
            uri: selectedFile.uri,
            range: selectedSnippet.range,
        });
    }, [selectedResult, vscodeAPI, results]);
    const toggleFileExpansion = react_1.default.useCallback((fileIndex) => {
        setCollapsedFileResults(prev => {
            const newCollapsedFileResults = { ...prev };
            newCollapsedFileResults[fileIndex] = !prev[fileIndex];
            return newCollapsedFileResults;
        });
    }, []);
    const onInputChange = react_1.default.useCallback((e) => {
        setQuery(e.target.value.trim());
    }, []);
    const onInputKeyDown = react_1.default.useCallback((e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (e.metaKey || !resultsCache.get(query)) {
                // bust cache, send new request immediately
                debouncedDoSearch.cancel();
                doSearch(vscodeAPI, query);
            }
        }
        else if (e.key === 'ArrowDown') {
            // detect if command key is selected
            if (e.metaKey && results.length > 0) {
                // remove focus from textarea
                outerContainerRef.current?.focus();
                if (selectedResult[0] === -1) {
                    setSelectedResult([0, -1]);
                }
            }
            e.stopPropagation();
        }
        else if (e.key === 'ArrowUp') {
            e.stopPropagation();
        }
    }, [vscodeAPI, resultsCache, query, results.length, selectedResult]);
    const onKeyDownUpdateSelection = react_1.default.useCallback((e) => {
        let [fileIndex, snippetIndex] = selectedResult;
        if (fileIndex === -1) {
            return;
        }
        if (e.metaKey && e.key === 'ArrowUp') {
            queryInputRef.current?.focus();
            return;
        }
        if (e.key === 'ArrowDown') {
            snippetIndex++;
            const numSnippets = collapsedFileResults[fileIndex]
                ? 0
                : results[fileIndex].snippets.length;
            if (snippetIndex >= numSnippets) {
                fileIndex++;
                if (fileIndex >= results.length) {
                    return;
                }
                snippetIndex = -1;
            }
            setSelectedResult([fileIndex, snippetIndex]);
        }
        else if (e.key === 'ArrowUp') {
            snippetIndex--;
            if (snippetIndex < -1) {
                fileIndex--;
                if (fileIndex < 0) {
                    return;
                }
                const numSnippets = collapsedFileResults[fileIndex]
                    ? 0
                    : results[fileIndex].snippets.length;
                snippetIndex = numSnippets - 1;
            }
            if (fileIndex < 0) {
                setSelectedResult([-1, -1]);
            }
            else {
                setSelectedResult([fileIndex, snippetIndex]);
            }
        }
        else if (e.key === 'ArrowLeft') {
            if (selectedResult[1] === -1) {
                // Collapse file
                setCollapsedFileResults(prev => {
                    const newCollapsedFileResults = { ...prev };
                    newCollapsedFileResults[fileIndex] = true;
                    return newCollapsedFileResults;
                });
            }
            else {
                // Select file
                setSelectedResult([selectedResult[0], -1]);
            }
        }
        else if (e.key === 'ArrowRight') {
            if (selectedResult[1] === -1) {
                if (collapsedFileResults[fileIndex]) {
                    // Expand file
                    setCollapsedFileResults(prev => {
                        const newCollapsedFileResults = { ...prev };
                        delete newCollapsedFileResults[fileIndex];
                        return newCollapsedFileResults;
                    });
                }
                else {
                    // Select snippet
                    setSelectedResult([selectedResult[0], 0]);
                }
            }
        }
    }, [selectedResult, results, collapsedFileResults]);
    return ((0, jsx_runtime_1.jsxs)("div", { role: "listbox", className: SearchPanel_module_css_1.default.outerContainer, onKeyDown: onKeyDownUpdateSelection, tabIndex: 0, ref: outerContainerRef, children: [(0, jsx_runtime_1.jsx)("form", { className: SearchPanel_module_css_1.default.inputRow, children: (0, jsx_runtime_1.jsx)("div", { className: SearchPanel_module_css_1.default.searchInputContainer, children: (0, jsx_runtime_1.jsx)("textarea", { placeholder: "Search", className: SearchPanel_module_css_1.default.searchInput, onChange: onInputChange, onKeyDown: onInputKeyDown, ref: queryInputRef }) }) }), !searching && query.trim().length === 0 && ((0, jsx_runtime_1.jsx)("p", { className: SearchPanel_module_css_1.default.instructions, children: "Search for code using a natural language query, such as \u201Cpassword hashing\u201D, \"connection retries\", a symbol name, or a topic." })), !searching && results.length === 0 && query.trim().length !== 0 && ((0, jsx_runtime_1.jsx)("p", { className: SearchPanel_module_css_1.default.instructions, children: "No results found" })), (0, jsx_runtime_1.jsx)("div", { className: SearchPanel_module_css_1.default.searchResultsContainer, children: results.map((result, fileIndex) => ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)("div", { className: SearchPanel_module_css_1.default.searchResultRow, onKeyDown: e => {
                                if (e.key === 'Enter') {
                                    toggleFileExpansion(fileIndex);
                                    setSelectedResult([fileIndex, 0]);
                                }
                            }, onClick: () => {
                                toggleFileExpansion(fileIndex);
                                setSelectedResult([fileIndex, -1]);
                            }, children: (0, jsx_runtime_1.jsxs)("div", { className: `${SearchPanel_module_css_1.default.searchResultRowInner} ${selectedResult[0] === fileIndex &&
                                    selectedResult[1] === -1 &&
                                    SearchPanel_module_css_1.default.searchResultRowInnerSelected}`, children: [(0, jsx_runtime_1.jsx)("div", { className: SearchPanel_module_css_1.default.searchResultTwistie, onClick: () => toggleFileExpansion(fileIndex), onKeyDown: e => e.key === 'Enter' && toggleFileExpansion(fileIndex), children: (0, jsx_runtime_1.jsx)("i", { className: `codicon ${collapsedFileResults[fileIndex]
                                                ? 'codicon-chevron-right'
                                                : 'codicon-chevron-down'}` }) }), (0, jsx_runtime_1.jsx)("div", { className: SearchPanel_module_css_1.default.searchResultContent, children: (0, jsx_runtime_1.jsxs)("div", { className: SearchPanel_module_css_1.default.filematchLabel, children: [(0, jsx_runtime_1.jsx)("span", { className: SearchPanel_module_css_1.default.filematchIcon, children: (0, jsx_runtime_1.jsx)("i", { className: "codicon codicon-file-code" }) }), (0, jsx_runtime_1.jsx)("span", { className: SearchPanel_module_css_1.default.filematchTitle, title: (0, cody_shared_1.displayPathBasename)(result.uri), children: (0, cody_shared_1.displayPathBasename)(result.uri) }), (0, jsx_runtime_1.jsx)("span", { className: SearchPanel_module_css_1.default.filematchDescription, children: (0, jsx_runtime_1.jsx)("span", { title: (0, cody_shared_1.displayPathDirname)(result.uri), children: (0, cody_shared_1.displayPathDirname)(result.uri) }) })] }) })] }) }, `${result.uri.toString()}`), !collapsedFileResults[fileIndex] &&
                            result.snippets.map((snippet, snippetIndex) => ((0, jsx_runtime_1.jsx)("div", { className: SearchPanel_module_css_1.default.searchResultRow, onClick: () => setSelectedResult([fileIndex, snippetIndex]), onKeyDown: e => e.key === 'Enter' && setSelectedResult([fileIndex, snippetIndex]), children: (0, jsx_runtime_1.jsxs)("div", { className: `${SearchPanel_module_css_1.default.searchResultRowInner} ${selectedResult[0] === fileIndex &&
                                        selectedResult[1] === snippetIndex &&
                                        SearchPanel_module_css_1.default.searchResultRowInnerSelected}`, children: [(0, jsx_runtime_1.jsx)("div", { className: SearchPanel_module_css_1.default.searchResultIndent, children: (0, jsx_runtime_1.jsx)("div", { className: SearchPanel_module_css_1.default.searchResultIndentGuide }) }), (0, jsx_runtime_1.jsx)("div", { className: `${SearchPanel_module_css_1.default.searchResultTwistie} ${SearchPanel_module_css_1.default.searchResultTwistieNoindent}` }), (0, jsx_runtime_1.jsx)("div", { className: SearchPanel_module_css_1.default.searchResultContent, children: firstInterestingLine(snippet.contents) })] }) }, `${result.uri.toString()}#L${snippet.range.start.line}:${snippet.range.start.character}-${snippet.range.end.line}:${snippet.range.end.character}`)))] }))) })] }));
};
exports.SearchPanel = SearchPanel;
function firstInterestingLine(contents) {
    const lines = contents.split('\n');
    for (const line of lines) {
        if (line.trim().length > 3) {
            return line;
        }
    }
    return lines[0];
}
