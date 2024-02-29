"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const TextDocumentWithUri_1 = require("./TextDocumentWithUri");
(0, vitest_1.describe)('TextDocumentWithUri', () => {
    (0, vitest_1.it)('handles URIs with exclamation marks', () => {
        const uri = 'file:///Users/com.jetbrains/ideaIC-2022.1-sources.jar!/com/intellij/RequiresBackgroundThread.java';
        const textDocument = TextDocumentWithUri_1.ProtocolTextDocumentWithUri.fromDocument({ uri });
        (0, vitest_1.expect)(textDocument.uri.toString()).toStrictEqual(textDocument.underlying.uri);
        (0, vitest_1.expect)(textDocument.uri.toString()).toStrictEqual('file:///Users/com.jetbrains/ideaIC-2022.1-sources.jar%21/com/intellij/RequiresBackgroundThread.java');
    });
});
