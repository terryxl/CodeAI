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
exports.getFoldingRanges = void 0;
const vscode = __importStar(require("vscode"));
const lodash_1 = require("lodash");
const cody_shared_1 = require("@sourcegraph/cody-shared");
/**
 * Gets folding ranges for the given URI.
 * @param uri - The URI of the document to get folding ranges for.
 * @param type - Optional type of folding ranges to get. Can be 'imports', 'comment' or 'all'. Default 'all'.
 * @param getLastItem - Optional boolean whether to only return the last range of the given type. Default false.
 * @returns A promise resolving to the array of folding ranges, or undefined if none.
 *
 * This calls the built-in VS Code folding range provider to get folding ranges for the given URI.
 * It can filter the results to only return ranges of a certain type, like imports or comments.
 * The getLastItem flag returns just the last range of the given type.
 */
async function getFoldingRanges(uri, type, getLastItem) {
    return (0, cody_shared_1.wrapInActiveSpan)('commands.context.foldingRange', async (span) => {
        // Run built-in command to get folding ranges
        const foldingRanges = await vscode.commands.executeCommand('vscode.executeFoldingRangeProvider', uri);
        if (type === 'all') {
            return foldingRanges;
        }
        const kind = type === 'imports' ? vscode.FoldingRangeKind.Imports : vscode.FoldingRangeKind.Comment;
        if (!getLastItem) {
            const ranges = foldingRanges?.filter(range => range.kind === kind);
            return ranges;
        }
        // Get the line number of the last import statement
        const lastKind = foldingRanges
            ? (0, lodash_1.findLast)(foldingRanges, range => range.kind === kind)
            : undefined;
        return lastKind ? [lastKind] : [];
    });
}
exports.getFoldingRanges = getFoldingRanges;
