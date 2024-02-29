import type { EditCommandResult } from '../../main';
import type { CodyCommandArgs } from '../types';
/**
 * Adds generated test cases to the selected test suite inline.
 *
 * NOTE: Used by Code Lenses in test files with 'cody.command.tests-cases'.
 */
export declare function executeTestCaseEditCommand(args?: Partial<CodyCommandArgs>): Promise<EditCommandResult | undefined>;
//# sourceMappingURL=test-case.d.ts.map