"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GuardrailsProvider = void 0;
const cody_shared_1 = require("@sourcegraph/cody-shared");
class GuardrailsProvider {
    client;
    editor;
    // TODO(keegancsmith) this provider should create the client since the guardrails client requires a dotcom graphql connection.
    constructor(client, editor) {
        this.client = client;
        this.editor = editor;
    }
    async debugEditorSelection() {
        const snippet = this.editor.getActiveTextEditorSelection()?.selectedText;
        if (snippet === undefined) {
            return;
        }
        const msg = await this.client.searchAttribution(snippet).then(cody_shared_1.summariseAttribution);
        await this.editor.showWarningMessage(msg);
    }
}
exports.GuardrailsProvider = GuardrailsProvider;
