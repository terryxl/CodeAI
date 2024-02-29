"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderContextItem = exports.contextItemId = void 0;
const cody_shared_1 = require("@sourcegraph/cody-shared");
const vscode_uri_1 = require("vscode-uri");
function contextItemId(contextItem) {
    return contextItem.range
        ? `${contextItem.uri.toString()}#${contextItem.range.start.line}:${contextItem.range.end.line}`
        : contextItem.uri.toString();
}
exports.contextItemId = contextItemId;
function renderContextItem(contextItem) {
    // Do not create context item for empty file
    if (!contextItem.text?.trim()?.length) {
        return [];
    }
    let messageText;
    const uri = contextItem.source === 'unified' ? vscode_uri_1.URI.parse(contextItem.title || '') : contextItem.uri;
    if (contextItem.source === 'selection') {
        messageText = (0, cody_shared_1.populateCurrentSelectedCodeContextTemplate)(contextItem.text, uri);
    }
    else if (contextItem.source === 'editor') {
        // This template text works best with prompts in our commands
        // Using populateCodeContextTemplate here will cause confusion to Cody
        const templateText = 'Codebase context from file path {fileName}: ';
        messageText = (0, cody_shared_1.populateContextTemplateFromText)(templateText, contextItem.text, uri);
    }
    else if (contextItem.source === 'terminal') {
        messageText = contextItem.text;
    }
    else if ((0, cody_shared_1.languageFromFilename)(uri) === cody_shared_1.ProgrammingLanguage.Markdown) {
        messageText = (0, cody_shared_1.populateMarkdownContextTemplate)(contextItem.text, uri, contextItem.repoName);
    }
    else {
        messageText = (0, cody_shared_1.populateCodeContextTemplate)(contextItem.text, uri, contextItem.repoName);
    }
    return [
        { speaker: 'human', text: messageText },
        { speaker: 'assistant', text: 'Ok.' },
    ];
}
exports.renderContextItem = renderContextItem;
