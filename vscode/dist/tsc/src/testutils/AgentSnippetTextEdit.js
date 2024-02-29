"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentSnippetTextEdit = void 0;
class AgentSnippetTextEdit {
    range;
    snippet;
    constructor(range, snippet) {
        this.range = range;
        this.snippet = snippet;
    }
    static replace(range, snippet) {
        throw new Error('not implemented');
    }
    static insert(position, snippet) {
        throw new Error('not implemented');
    }
}
exports.AgentSnippetTextEdit = AgentSnippetTextEdit;
