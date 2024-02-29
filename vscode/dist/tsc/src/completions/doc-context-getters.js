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
exports.getCompletionIntent = exports.getContextRange = exports.getCurrentLinePrefixWithoutInjectedPrefix = void 0;
const vscode = __importStar(require("vscode"));
const language_1 = require("../tree-sitter/language");
const query_sdk_1 = require("../tree-sitter/query-sdk");
function getCurrentLinePrefixWithoutInjectedPrefix(docContext) {
    const { currentLinePrefix, injectedPrefix } = docContext;
    return injectedPrefix ? currentLinePrefix.slice(0, -injectedPrefix.length) : currentLinePrefix;
}
exports.getCurrentLinePrefixWithoutInjectedPrefix = getCurrentLinePrefixWithoutInjectedPrefix;
/**
 * @returns the range that overlaps the included prefix and suffix.
 */
function getContextRange(document, params) {
    const { prefix, suffix, position } = params;
    const offset = document.offsetAt(position);
    return new vscode.Range(document.positionAt(offset - prefix.length), document.positionAt(offset + suffix.length));
}
exports.getContextRange = getContextRange;
function getCompletionIntent(params) {
    const { document, position, prefix } = params;
    const blockStart = (0, language_1.getLanguageConfig)(document.languageId)?.blockStart;
    const isBlockStartActive = blockStart && prefix.trimEnd().endsWith(blockStart);
    // Use `blockStart` for the cursor position if it's active.
    const positionBeforeCursor = isBlockStartActive
        ? document.positionAt(prefix.lastIndexOf(blockStart))
        : {
            line: position.line,
            character: Math.max(0, position.character - 1),
        };
    const [completionIntent] = (0, query_sdk_1.execQueryWrapper)(document, positionBeforeCursor, 'getCompletionIntent');
    return completionIntent?.name;
}
exports.getCompletionIntent = getCompletionIntent;
