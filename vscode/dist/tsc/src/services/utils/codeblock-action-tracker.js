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
exports.onTextDocumentChange = exports.handleCopiedCode = exports.handleCodeFromSaveToNewFile = exports.handleCodeFromInsertAtCursor = void 0;
const vscode = __importStar(require("vscode"));
const active_editor_1 = require("../../editor/active-editor");
const telemetry_1 = require("../telemetry");
const telemetry_v2_1 = require("../telemetry-v2");
const code_count_1 = require("./code-count");
/**
 * It tracks the last stored code snippet and metadata like lines, chars, event, source etc.
 * This is used to track acceptance of generated code by Cody for Chat and Commands
 */
let lastStoredCode = {
    code: 'init',
    lineCount: 0,
    charCount: 0,
    eventName: '',
    source: '',
    requestID: '',
};
let insertInProgress = false;
let lastClipboardText = '';
/**
 * Sets the last stored code snippet and associated metadata.
 *
 * This is used to track code generation events in VS Code.
 */
function setLastStoredCode(code, eventName, source = 'chat', requestID = '') {
    // All non-copy events are considered as insertions since we don't need to listen for paste events
    insertInProgress = !eventName.includes('copy');
    const { lineCount, charCount } = (0, code_count_1.countCode)(code);
    const codeCount = { code, lineCount, charCount, eventName, source, requestID };
    lastStoredCode = codeCount;
    // Currently supported events are: copy, insert, save
    const op = eventName.includes('copy') ? 'copy' : eventName.startsWith('insert') ? 'insert' : 'save';
    const args = { op, charCount, lineCount, source, requestID };
    telemetry_1.telemetryService.log(`CodyVSCodeExtension:${eventName}:clicked`, { args, hasV2Event: true });
    telemetry_v2_1.telemetryRecorder.recordEvent(`cody.${eventName}`, 'clicked', {
        metadata: {
            lineCount,
            charCount,
        },
        interactionID: requestID,
        privateMetadata: {
            source,
            op,
        },
    });
    return codeCount;
}
async function setLastTextFromClipboard(clipboardText) {
    lastClipboardText = clipboardText || (await vscode.env.clipboard.readText());
}
/**
 * Handles insert event to insert text from code block at cursor position
 * Replace selection if there is one and then log insert event
 * Note: Using workspaceEdit instead of 'editor.action.insertSnippet' as the later reformats the text incorrectly
 */
async function handleCodeFromInsertAtCursor(text, meta) {
    const editor = (0, active_editor_1.getEditor)();
    const activeEditor = editor.active;
    const selectionRange = activeEditor?.selection;
    if (!activeEditor || !selectionRange) {
        throw new Error('No editor or selection found to insert text');
    }
    const edit = new vscode.WorkspaceEdit();
    // trimEnd() to remove new line added by Cody
    edit.insert(activeEditor.document.uri, selectionRange.start, `${text}\n`);
    await vscode.workspace.applyEdit(edit);
    // Log insert event
    const op = 'insert';
    const eventName = `${op}Button`;
    setLastStoredCode(text, eventName, meta?.source, meta?.requestID);
}
exports.handleCodeFromInsertAtCursor = handleCodeFromInsertAtCursor;
/**
 * Handles insert event to insert text from code block to new file
 */
function handleCodeFromSaveToNewFile(text, meta) {
    const eventName = 'saveButton';
    setLastStoredCode(text, eventName, meta?.source, meta?.requestID);
}
exports.handleCodeFromSaveToNewFile = handleCodeFromSaveToNewFile;
/**
 * Handles copying code and detecting a paste event.
 */
async function handleCopiedCode(text, isButtonClickEvent, meta) {
    // If it's a Button event, then the text is already passed in from the whole code block
    const copiedCode = isButtonClickEvent ? text : await vscode.env.clipboard.readText();
    const eventName = isButtonClickEvent ? 'copyButton' : 'keyDown:Copy';
    // Set for tracking
    if (copiedCode) {
        setLastStoredCode(copiedCode, eventName, meta?.source, meta?.requestID);
    }
}
exports.handleCopiedCode = handleCopiedCode;
// For tracking paste events for inline-chat
async function onTextDocumentChange(newCode) {
    const { code, lineCount, charCount, source, requestID } = lastStoredCode;
    if (!code) {
        return;
    }
    if (insertInProgress) {
        insertInProgress = false;
        return;
    }
    await setLastTextFromClipboard();
    // the copied code should be the same as the clipboard text
    if ((0, code_count_1.matchCodeSnippets)(code, lastClipboardText) && (0, code_count_1.matchCodeSnippets)(code, newCode)) {
        const op = 'paste';
        const eventType = 'keyDown';
        // e.g.'CodyVSCodeExtension:keyDown:Paste:clicked'
        telemetry_1.telemetryService.log(`CodyVSCodeExtension:${eventType}:Paste:clicked`, {
            op,
            lineCount,
            charCount,
            source,
            requestID,
            hasV2Event: true,
        });
        telemetry_v2_1.telemetryRecorder.recordEvent(`cody.${eventType}`, 'paste', {
            metadata: {
                lineCount,
                charCount,
            },
            interactionID: requestID,
            privateMetadata: {
                source,
                op,
            },
        });
    }
}
exports.onTextDocumentChange = onTextDocumentChange;
