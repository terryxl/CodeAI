import type { SourcegraphCompletionsClient } from '../sourcegraph-api/completions/client';
import type { IntentClassificationOption, IntentDetector } from '.';
export declare class SourcegraphIntentDetectorClient implements IntentDetector {
    private completionsClient?;
    constructor(completionsClient?: SourcegraphCompletionsClient | undefined);
    isEditorContextRequired(input: string): boolean | Error;
    private buildInitialTranscript;
    private buildExampleTranscript;
    classifyIntentFromOptions<Intent extends string>(input: string, options: IntentClassificationOption<Intent>[], fallback: Intent): Promise<Intent>;
}
//# sourceMappingURL=client.d.ts.map