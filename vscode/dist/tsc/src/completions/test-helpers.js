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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.nextTick = exports.documentAndPosition = exports.document = exports.completion = void 0;
const dedent_1 = __importDefault(require("dedent"));
const vscode_languageserver_textdocument_1 = require("vscode-languageserver-textdocument");
const cody_shared_1 = require("@sourcegraph/cody-shared");
const textDocument_1 = require("../testutils/textDocument");
__exportStar(require("../tree-sitter/test-helpers"), exports);
/**
 * A tag function for creating a {@link CompletionResponse}, for use in tests only.
 *
 * - `├` start of the inline completion to insert
 * - `┤` end of the inline completion to insert
 * - `┴` use for indent placeholder, should be placed at last line after `┤`
 */
function completion(string, ...values) {
    const raw = (0, dedent_1.default)(string, ...values);
    let completion = raw;
    const start = raw.indexOf('├');
    const end = raw.lastIndexOf('┤');
    if (0 <= start && start <= end) {
        completion = raw.slice(start + 1, end);
    }
    return {
        completion,
        stopReason: 'unknown',
    };
}
exports.completion = completion;
const CURSOR_MARKER = '█';
function document(text, languageId = 'typescript', uriString = (0, cody_shared_1.testFileUri)('test.ts').toString()) {
    return (0, textDocument_1.wrapVSCodeTextDocument)(vscode_languageserver_textdocument_1.TextDocument.create(uriString, languageId, 0, text));
}
exports.document = document;
function documentAndPosition(textWithCursor, languageId, uriString) {
    const cursorIndex = textWithCursor.indexOf(CURSOR_MARKER);
    if (cursorIndex === -1) {
        throw new Error(`The test text must include a ${CURSOR_MARKER} to denote the cursor position.`);
    }
    const prefix = textWithCursor.slice(0, cursorIndex);
    const suffix = textWithCursor.slice(cursorIndex + CURSOR_MARKER.length);
    const doc = document(prefix + suffix, languageId, uriString);
    const position = doc.positionAt(cursorIndex);
    return { document: doc, position };
}
exports.documentAndPosition = documentAndPosition;
function nextTick() {
    return new Promise(resolve => setTimeout(resolve, 0));
}
exports.nextTick = nextTick;
