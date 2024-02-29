import { type CompletionParameters, type Message, type EditModel } from '@sourcegraph/cody-shared';
import type { VSCodeEditor } from '../../editor/vscode-editor';
import type { FixupTask } from '../../non-stop/FixupTask';
interface BuildInteractionOptions {
    model: EditModel;
    contextWindow: number;
    task: FixupTask;
    editor: VSCodeEditor;
}
interface BuiltInteraction extends Pick<CompletionParameters, 'stopSequences'> {
    messages: Message[];
    responseTopic: string;
    responsePrefix?: string;
}
export declare const buildInteraction: ({ model, contextWindow, task, editor, }: BuildInteractionOptions) => Promise<BuiltInteraction>;
export {};
//# sourceMappingURL=index.d.ts.map