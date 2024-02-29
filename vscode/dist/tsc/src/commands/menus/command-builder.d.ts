import type { CodyCommand } from '@sourcegraph/cody-shared';
import { CustomCommandType } from '@sourcegraph/cody-shared/src/commands/types';
export interface CustomCommandsBuilder {
    key: string;
    prompt: CodyCommand;
    type: CustomCommandType;
}
export declare class CustomCommandsBuilderMenu {
    start(commands: string[]): Promise<CustomCommandsBuilder | null>;
    private makeCommandKey;
    private makePrompt;
    private addContext;
    private makeType;
}
//# sourceMappingURL=command-builder.d.ts.map