"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentTextEdit = void 0;
class AgentTextEdit {
    range;
    newText;
    newEol;
    metadata;
    constructor(range, newText, newEol) {
        this.range = range;
        this.newText = newText;
        this.newEol = newEol;
    }
    static replace(range, newText) {
        throw new Error('not implemented');
    }
    static insert(position, newText) {
        throw new Error('not implemented');
    }
    static delete(range) {
        throw new Error('not implemented');
    }
    static setEndOfLine(eol) {
        throw new Error('not implemented');
    }
}
exports.AgentTextEdit = AgentTextEdit;
