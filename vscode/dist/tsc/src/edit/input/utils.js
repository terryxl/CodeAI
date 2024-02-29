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
exports.fetchDocumentSymbols = exports.getItemLabel = exports.getTitleRange = exports.getLabelForContextFile = exports.removeAfterLastAt = void 0;
const vscode = __importStar(require("vscode"));
const cody_shared_1 = require("@sourcegraph/cody-shared");
const constants_1 = require("./constants");
/**
 * Removes the string after the last '@' character in the given string.
 * Returns the original string if '@' is not found.
 */
function removeAfterLastAt(str) {
    const lastIndex = str.lastIndexOf('@');
    if (lastIndex === -1) {
        // Return the original string if "@" is not found
        return str;
    }
    return str.slice(0, lastIndex);
}
exports.removeAfterLastAt = removeAfterLastAt;
/**
 * Returns a string representation of the given ContextFile for use in UI labels.
 * Includes the file path and an optional range or symbol specifier.
 */
function getLabelForContextFile(file) {
    const isFileType = file.type === 'file';
    const rangeLabel = file.range ? `:${file.range?.start.line}-${file.range?.end.line}` : '';
    if (isFileType) {
        return `${(0, cody_shared_1.displayPath)(file.uri)}${rangeLabel}`;
    }
    return `${(0, cody_shared_1.displayPath)(file.uri)}${rangeLabel}#${file.symbolName}`;
}
exports.getLabelForContextFile = getLabelForContextFile;
/**
 * Returns a string representation of the given range, formatted as "{startLine}:{endLine}".
 * If startLine and endLine are the same, returns just the line number.
 */
function getTitleRange(range) {
    if (range.isEmpty) {
        // No selected range, return just active line
        return `${range.start.line + 1}`;
    }
    const endLine = range.end.character === 0 ? range.end.line - 1 : range.end.line;
    if (range.start.line === endLine) {
        // Range only encompasses a single line
        return `${range.start.line + 1}`;
    }
    return `${range.start.line + 1}:${endLine + 1}`;
}
exports.getTitleRange = getTitleRange;
/**
 * Returns the label for the given QuickPickItem, stripping any
 * prefixes used internally to track state.
 */
function getItemLabel(item) {
    return item.label
        .replace(constants_1.QUICK_PICK_ITEM_EMPTY_INDENT_PREFIX, '')
        .replace(constants_1.QUICK_PICK_ITEM_CHECKED_PREFIX, '')
        .trim();
}
exports.getItemLabel = getItemLabel;
async function fetchDocumentSymbols(document) {
    const symbols = await vscode.commands.executeCommand('vscode.executeDocumentSymbolProvider', document.uri);
    if (!symbols) {
        return [];
    }
    const flattenSymbols = (symbol) => {
        return [symbol, ...symbol.children.flatMap(flattenSymbols)];
    };
    // Sort all symbols by their start position in the document
    return symbols.flatMap(flattenSymbols).sort((a, b) => a.range.start.compareTo(b.range.start));
}
exports.fetchDocumentSymbols = fetchDocumentSymbols;
