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
exports.ProtocolTextDocumentWithUri = void 0;
const vscode = __importStar(require("vscode"));
const log_1 = require("../log");
/**
 * Wrapper around `ProtocolTextDocument` that also contains a parsed vscode.Uri.
 *
 * We can't use `vscode.Uri` in `ProtocolTextDocument` because we use that type
 * in the JSON-RPC protocol where URIs are string-encoded.
 */
class ProtocolTextDocumentWithUri {
    uri;
    underlying;
    constructor(uri, underlying) {
        this.uri = uri;
        this.underlying = underlying ?? { uri: uri.toString() };
        if (this.underlying.uri !== uri.toString()) {
            (0, log_1.logDebug)('ProtocolTextDocumentWithUri', 'correcting invariant violation', `${this.uri} (this.uri) !== ${this.underlying.uri} (this.underlying.uri)`);
            this.underlying.uri = uri.toString();
        }
    }
    static fromDocument(document) {
        if (document?.uri === undefined && typeof document.filePath === 'string') {
            // TODO: remove support for `document.filePath` once the migration to URIs is complete
            const uri = vscode.Uri.file(document.filePath);
            document.uri = uri.toString();
            return new ProtocolTextDocumentWithUri(uri, document);
        }
        return new ProtocolTextDocumentWithUri(vscode.Uri.parse(document.uri), document);
    }
    static from(uri, document) {
        return new ProtocolTextDocumentWithUri(uri, { ...document, uri: uri.toString() });
    }
    get content() {
        return this.underlying.content;
    }
    get selection() {
        return this.underlying.selection;
    }
}
exports.ProtocolTextDocumentWithUri = ProtocolTextDocumentWithUri;
