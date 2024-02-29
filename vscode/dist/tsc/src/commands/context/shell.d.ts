import { type ContextFile } from '@sourcegraph/cody-shared';
/**
 * Creates a context file from executing a shell command. Used by CommandsController.
 *
 * Executes the given shell command, captures the output, wraps it in a context format,
 * and returns it as a ContextFile.
 */
export declare function getContextFileFromShell(command: string): Promise<ContextFile[]>;
//# sourceMappingURL=shell.d.ts.map