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
exports.extractContextItemsFromContextMessages = void 0;
const vscode = __importStar(require("vscode"));
const contextMessageToContextItem = ({ text, file }) => {
    return {
        text: text,
        range: file.range
            ? new vscode.Range(new vscode.Position(file.range.start.line, file.range.start.character), new vscode.Position(file.range.end.line, file.range.end.character))
            : undefined,
        repoName: file.repoName,
        revision: file.revision,
        source: file.source,
        title: file.title,
        uri: file.uri,
    };
};
const contextMessageIsExtractable = (contextMessage) => {
    return contextMessage.file !== undefined;
};
/**
 * Extract `ContextItems` from `ContextMessages` for interoperability
 * between existing context mechanisms in the codebase.
 *
 * TODO: These types are ultimately very similar, we should refactor this so we
 * can avoid maintaining both types.
 */
const extractContextItemsFromContextMessages = (contextMessages) => {
    return contextMessages.filter(contextMessageIsExtractable).map(contextMessageToContextItem);
};
exports.extractContextItemsFromContextMessages = extractContextItemsFromContextMessages;
