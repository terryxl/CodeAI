import { type ContextFile } from '@sourcegraph/cody-shared';
import type { URI } from 'vscode-uri';
/**
 * Gets context files related to the given test file.
 *
 * Searches for test files in the current directory first.
 * If none found, searches the entire workspace for test files.
 *
 * Returns only valid test files up to the max limit.
 *
 * NOTE: Does not work with Agent as the underlying API is not available in Agent.
 * NOTE: Used by the new unit test commands to get context files.
 */
export declare function getContextFilesForUnitTestCommand(file: URI): Promise<ContextFile[]>;
//# sourceMappingURL=unit-test-file.d.ts.map