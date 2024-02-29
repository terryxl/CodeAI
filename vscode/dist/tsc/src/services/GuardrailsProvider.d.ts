import { type Editor, type Guardrails } from '@sourcegraph/cody-shared';
export declare class GuardrailsProvider {
    private client;
    private editor;
    constructor(client: Guardrails, editor: Editor);
    debugEditorSelection(): Promise<void>;
}
//# sourceMappingURL=GuardrailsProvider.d.ts.map