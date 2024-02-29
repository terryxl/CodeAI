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
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseAllVisibleDocuments = exports.asPoint = exports.updateParseTreeOnEdit = exports.updateParseTreeCache = exports.getCachedParseTreeForDocument = void 0;
const lru_cache_1 = require("lru-cache");
const vscode = __importStar(require("vscode"));
const grammars_1 = require("./grammars");
const parser_1 = require("./parser");
const parseTreesPerFile = new lru_cache_1.LRUCache({
    max: 10,
});
function getCachedParseTreeForDocument(document) {
    const parseLanguage = getLanguageIfTreeSitterEnabled(document);
    if (!parseLanguage) {
        return null;
    }
    const parser = (0, parser_1.getParser)(parseLanguage);
    const cacheKey = document.uri.toString();
    const tree = parseTreesPerFile.get(cacheKey);
    if (!tree || !parser) {
        return null;
    }
    return { tree, parser, cacheKey };
}
exports.getCachedParseTreeForDocument = getCachedParseTreeForDocument;
async function parseDocument(document) {
    const parseLanguage = getLanguageIfTreeSitterEnabled(document);
    if (!parseLanguage) {
        return;
    }
    const parser = await (0, parser_1.createParser)({ language: parseLanguage });
    if (!parser) {
        return;
    }
    updateParseTreeCache(document, parser);
}
function updateParseTreeCache(document, parser) {
    const tree = parser.parse(document.getText());
    parseTreesPerFile.set(document.uri.toString(), tree);
}
exports.updateParseTreeCache = updateParseTreeCache;
function getLanguageIfTreeSitterEnabled(document) {
    const parseLanguage = (0, grammars_1.getParseLanguage)(document.languageId);
    /**
     * 1. Do not use tree-sitter for unsupported languages.
     * 2. Do not use tree-sitter for files with more than N lines to avoid performance issues.
     *    - https://github.com/tree-sitter/tree-sitter/issues/2144
     *    - https://github.com/neovim/neovim/issues/22426
     *
     *    Needs more testing to figure out if we need it. Playing it safe for the initial integration.
     */
    if (document.lineCount <= 10_000 && parseLanguage) {
        return parseLanguage;
    }
    return null;
}
function updateParseTreeOnEdit(edit) {
    const { document, contentChanges } = edit;
    if (contentChanges.length === 0) {
        return;
    }
    const cache = getCachedParseTreeForDocument(document);
    if (!cache) {
        return;
    }
    const { tree, parser, cacheKey } = cache;
    for (const change of contentChanges) {
        const startIndex = change.rangeOffset;
        const oldEndIndex = change.rangeOffset + change.rangeLength;
        const newEndIndex = change.rangeOffset + change.text.length;
        const startPosition = document.positionAt(startIndex);
        const oldEndPosition = document.positionAt(oldEndIndex);
        const newEndPosition = document.positionAt(newEndIndex);
        const startPoint = asPoint(startPosition);
        const oldEndPoint = asPoint(oldEndPosition);
        const newEndPoint = asPoint(newEndPosition);
        tree.edit({
            startIndex,
            oldEndIndex,
            newEndIndex,
            startPosition: startPoint,
            oldEndPosition: oldEndPoint,
            newEndPosition: newEndPoint,
        });
    }
    const updatedTree = parser.parse(document.getText(), tree);
    parseTreesPerFile.set(cacheKey, updatedTree);
}
exports.updateParseTreeOnEdit = updateParseTreeOnEdit;
function asPoint(position) {
    return { row: position.line, column: position.character };
}
exports.asPoint = asPoint;
function parseAllVisibleDocuments() {
    for (const editor of vscode.window.visibleTextEditors) {
        void parseDocument(editor.document);
    }
}
exports.parseAllVisibleDocuments = parseAllVisibleDocuments;
