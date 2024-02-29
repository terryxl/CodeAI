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
exports.getMatchingContext = void 0;
const vscode = __importStar(require("vscode"));
const editor_context_1 = require("../../editor/utils/editor-context");
const utils_1 = require("./utils");
/* Match strings that end with a '@' followed by any characters except a space */
const MATCHING_CONTEXT_FILE_REGEX = /@(\S+)$/;
/* Match strings that end with a '@#' followed by any characters except a space */
const MATCHING_SYMBOL_REGEX = /@#(\S+)$/;
const MAX_FUZZY_RESULTS = 20;
async function getMatchingContext(instruction) {
    const symbolMatch = instruction.match(MATCHING_SYMBOL_REGEX);
    if (symbolMatch) {
        const symbolResults = await (0, editor_context_1.getSymbolContextFiles)(symbolMatch[1], MAX_FUZZY_RESULTS);
        return symbolResults.map(result => ({
            key: (0, utils_1.getLabelForContextFile)(result),
            file: result,
            shortLabel: `${result.kind === 'class' ? '$(symbol-structure)' : '$(symbol-method)'} ${result.symbolName}`,
        }));
    }
    const fileMatch = instruction.match(MATCHING_CONTEXT_FILE_REGEX);
    if (fileMatch) {
        const cancellation = new vscode.CancellationTokenSource();
        const fileResults = await (0, editor_context_1.getFileContextFiles)(fileMatch[1], MAX_FUZZY_RESULTS, cancellation.token);
        return fileResults.map(result => ({
            key: (0, utils_1.getLabelForContextFile)(result),
            file: result,
        }));
    }
    return null;
}
exports.getMatchingContext = getMatchingContext;
