import type { EditCommandResult } from '../../main';
import type { CodyCommandArgs } from '../types';
/**
 * The command that generates a new docstring for the selected code.
 * When calls, the command will be executed as an inline-edit command.
 *
 * Context: add by the edit command
 */
export declare function executeDocCommand(args?: Partial<CodyCommandArgs>): Promise<EditCommandResult | undefined>;
//# sourceMappingURL=doc.d.ts.map