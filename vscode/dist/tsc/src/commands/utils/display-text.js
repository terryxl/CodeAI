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
exports.replaceFileNameWithMarkdownLink = exports.CODY_PASSTHROUGH_VSCODE_OPEN_COMMAND_ID = exports.createDisplayTextWithFileSelection = exports.createDisplayTextWithFileLinks = void 0;
const vscode = __importStar(require("vscode"));
const cody_shared_1 = require("@sourcegraph/cody-shared");
const test_commands_1 = require("./test-commands");
/**
 * Creates display text for the given context files by replacing file names with markdown links.
 */
function createDisplayTextWithFileLinks(humanInput, files) {
    let formattedText = humanInput;
    for (const file of files) {
        if (file.uri) {
            const range = file.range
                ? new vscode.Range(file.range.start.line, file.range.start.character, file.range.end.line, file.range.end.character)
                : undefined;
            formattedText = replaceFileNameWithMarkdownLink(formattedText, file.uri, range, file.type === 'symbol' ? file.symbolName : undefined);
        }
    }
    return formattedText;
}
exports.createDisplayTextWithFileLinks = createDisplayTextWithFileLinks;
/**
 * Gets the display text to show for the human's input.
 *
 * If there is a selection, display the file name + range alongside with human input
 * If the workspace root is available, it generates a markdown link to the file.
 */
function createDisplayTextWithFileSelection(humanInput, selection) {
    if (!selection) {
        return humanInput;
    }
    const range = selection.selectionRange
        ? new vscode.Range(selection.selectionRange.start.line, selection.selectionRange.start.character, selection.selectionRange.end.line, selection.selectionRange.end.character)
        : undefined;
    const displayText = `${humanInput} @${inputRepresentation(selection.fileUri, range)}`;
    // Create markdown link to the file
    return replaceFileNameWithMarkdownLink(displayText, selection.fileUri, range);
}
exports.createDisplayTextWithFileSelection = createDisplayTextWithFileSelection;
/**
 * VS Code intentionally limits what `command:vscode.open?ARGS` can have for args (see
 * https://github.com/microsoft/vscode/issues/178868#issuecomment-1494826381); you can't pass a
 * selection or viewColumn. We need to proxy `vscode.open` to be able to pass these args.
 *
 * Also update `lib/shared/src/chat/markdown.ts`'s `ALLOWED_URI_REGEXP` if you change this.
 */
exports.CODY_PASSTHROUGH_VSCODE_OPEN_COMMAND_ID = '_cody.vscode.open';
/**
 * Replaces a file name in given text with markdown link to open that file in editor.
 * @returns The updated text with the file name replaced by a markdown link.
 */
function replaceFileNameWithMarkdownLink(humanInput, file, range, symbolName) {
    const inputRepr = inputRepresentation(file, range, symbolName);
    // Then encode the complete link to go into Markdown.
    const markdownText = `[_@${inputRepr}_](command:${exports.CODY_PASSTHROUGH_VSCODE_OPEN_COMMAND_ID}?${encodeURIComponent(JSON.stringify([
        file.toJSON(),
        {
            selection: range,
            preserveFocus: true,
            background: true,
            preview: true,
            viewColumn: vscode.ViewColumn.Beside,
        },
    ]))})`;
    // Use regex to makes sure the file name is surrounded by spaces and not a substring of another file name
    const textToBeReplaced = new RegExp(`\\s*@${inputRepr.replaceAll(/[$()*+./?[\\\]^{|}-]/g, '\\$&')}(?!\\S)`, 'g');
    const text = humanInput
        .replace(test_commands_1.trailingNonAlphaNumericRegex, '')
        .replaceAll(textToBeReplaced, ` ${markdownText}`);
    const lastChar = test_commands_1.trailingNonAlphaNumericRegex.test(humanInput) ? humanInput.slice(-1) : '';
    return (text + lastChar).trim();
}
exports.replaceFileNameWithMarkdownLink = replaceFileNameWithMarkdownLink;
function inputRepresentation(file, range, symbolName) {
    return [
        (0, cody_shared_1.displayPath)(file),
        range && !(range.start.line === 0 && range.end.line === 0)
            ? `:${range.start.line}-${range.end.line}`
            : '',
        symbolName ? `#${symbolName}` : '',
    ]
        .join('')
        .trim();
}
