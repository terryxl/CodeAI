"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentSnippetString = void 0;
class AgentSnippetString {
    value = '';
    constructor(value) {
        if (value) {
            this.value = value;
        }
    }
    appendText(string) {
        throw new Error('Method not implemented.');
    }
    appendTabstop(number) {
        throw new Error('Method not implemented.');
    }
    appendPlaceholder(value, number) {
        throw new Error('Method not implemented.');
    }
    appendChoice(values, number) {
        throw new Error('Method not implemented.');
    }
    appendVariable(name, defaultValue) {
        throw new Error('Method not implemented.');
    }
}
exports.AgentSnippetString = AgentSnippetString;
