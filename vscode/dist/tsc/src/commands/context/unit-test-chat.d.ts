/// <reference path="../../../../../src/fileUri.d.ts" />
import { type ContextFile } from '@sourcegraph/cody-shared';
import type * as vscode from 'vscode';
/**
 * Gets context files related to the given test file.
 *
 * Searches for test files in the current directory first.
 * If none found, searches the entire workspace for test files.
 *
 * Returns only valid test files up to the max limit.
 *
 * NOTE: This is used by the current unit test commands to get context files.
 * NOTE: Will be replaced by the new unit test commands once it's ready.
 */
export declare function getContextFilesForTestCommand(file: vscode.Uri): Promise<ContextFile[]>;
//# sourceMappingURL=unit-test-chat.d.ts.map