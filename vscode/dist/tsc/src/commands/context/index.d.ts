import { type CodyCommandContext, type ContextFile } from '@sourcegraph/cody-shared';
/**
 * Gets the context files for a Cody command based on the given configuration.
 *
 * This handles getting context files from the selection, current file,
 * file path, directories, and open tabs based on the `config` object passed in.
 *
 * Context from context.command is added during the initial step in CommandController.
 *
 * The returned context files are filtered to remove any files ignored by Cody.
 */
export declare const getCommandContextFiles: (config: CodyCommandContext) => Promise<ContextFile[]>;
//# sourceMappingURL=index.d.ts.map