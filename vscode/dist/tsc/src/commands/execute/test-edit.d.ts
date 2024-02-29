import type { EditCommandResult } from '../../main';
import type { CodyCommandArgs } from '../types';
/**
 * Command that generates a new test file for the selected code with unit tests added.
 * When calls, the command will be executed as an inline-edit command.
 *
 * Context: Test files, current selection, and current file
 */
export declare function executeTestEditCommand(args?: Partial<CodyCommandArgs>): Promise<EditCommandResult | undefined>;
//# sourceMappingURL=test-edit.d.ts.map