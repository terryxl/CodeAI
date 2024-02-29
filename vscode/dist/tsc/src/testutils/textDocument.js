"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withPosixPathsInString = exports.withPosixPaths = exports.range = exports.wrapVSCodeTextDocument = void 0;
const vscode_uri_1 = require("vscode-uri");
const mocks_1 = require("./mocks");
function wrapVSCodeTextDocument(doc) {
    const uri = vscode_uri_1.URI.parse(doc.uri);
    return {
        uri,
        languageId: doc.languageId,
        version: doc.version,
        lineCount: doc.lineCount,
        offsetAt: doc.offsetAt.bind(doc),
        getText: doc.getText.bind(doc),
        fileName: vscode_uri_1.URI.parse(doc.uri).fsPath,
        isUntitled: false,
        isDirty: false,
        isClosed: false,
        save: () => Promise.resolve(false),
        eol: 1,
        positionAt(offset) {
            const pos = doc.positionAt(offset);
            return new mocks_1.vsCodeMocks.Position(pos.line, pos.character);
        },
        lineAt(position) {
            const line = typeof position === 'number' ? position : position.line;
            const lines = doc.getText().split('\n');
            const text = lines[line];
            return createTextLine(text, new mocks_1.vsCodeMocks.Range(line, 0, line, text.length));
        },
        getWordRangeAtPosition() {
            throw new Error('Method not implemented.');
        },
        validateRange() {
            throw new Error('Method not implemented.');
        },
        validatePosition() {
            throw new Error('Method not implemented.');
        },
    };
}
exports.wrapVSCodeTextDocument = wrapVSCodeTextDocument;
function createTextLine(text, range) {
    return {
        lineNumber: range.start.line,
        text,
        range,
        rangeIncludingLineBreak: range.with({ end: range.end.translate({ characterDelta: 1 }) }),
        firstNonWhitespaceCharacterIndex: text.match(/^\s*/)[0].length,
        isEmptyOrWhitespace: /^\s*$/.test(text),
    };
}
function range(startLine, startCharacter, endLine, endCharacter) {
    return new mocks_1.vsCodeMocks.Range(startLine, startCharacter, endLine || startLine, endCharacter || 0);
}
exports.range = range;
/**
 * A helper to convert paths and file URIs on objects to posix form so that test snapshots can always use
 * forward slashes and work on Windows.
 *
 * Drive letters will be removed so that `c:\foo.txt` on Windows and `/foo.txt` on POSIX will both be set
 * to `/foo.txt`.
 *
 * This function is only intended to be used to simplify expectations that compare to JSON objects and/or
 * inline snapshots (all production code executed in the test must handle Windows paths correctly).
 * @param obj the object (or array of objects) to fix paths on
 * @returns obj
 */
function withPosixPaths(obj) {
    if ('fileName' in obj && typeof obj.fileName === 'string') {
        obj.fileName = normalizeFilePathToPosix(obj.fileName);
    }
    if ('fileUri' in obj && vscode_uri_1.URI.isUri(obj.fileUri) && obj.fileUri.scheme === 'file') {
        const normalizedPath = normalizeFilePathToPosix(obj.fileUri.fsPath);
        obj.fileUri =
            obj.fileUri instanceof mocks_1.vsCodeMocks.Uri
                ? mocks_1.vsCodeMocks.Uri.file(normalizedPath)
                : vscode_uri_1.URI.file(normalizedPath);
    }
    if ('uri' in obj && vscode_uri_1.URI.isUri(obj.uri) && obj.uri.scheme === 'file') {
        const normalizedPath = normalizeFilePathToPosix(obj.uri.fsPath);
        obj.uri =
            obj.uri instanceof mocks_1.vsCodeMocks.Uri
                ? mocks_1.vsCodeMocks.Uri.file(normalizedPath)
                : vscode_uri_1.URI.file(normalizedPath);
    }
    if (Array.isArray(obj)) {
        for (const objItem of obj) {
            withPosixPaths(objItem);
        }
    }
    return obj;
}
exports.withPosixPaths = withPosixPaths;
function withPosixPathsInString(text) {
    return text
        .replaceAll('file:///c%3A%5C', 'file:///')
        .replaceAll('file:///c%3A/', 'file:///')
        .replaceAll('\\', '/');
}
exports.withPosixPathsInString = withPosixPathsInString;
function normalizeFilePathToPosix(filePath) {
    // Remove any drive letter.
    if (filePath[1] === ':') {
        filePath = filePath.slice(2);
    }
    // Use forward slashes.
    return filePath.replaceAll('\\', '/');
}
