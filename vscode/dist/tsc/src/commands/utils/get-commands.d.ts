import type { CodyCommand } from '@sourcegraph/cody-shared';
import type { CodyCommandArgs } from '../types';
import type { CodyCommandType } from '@sourcegraph/cody-shared/src/commands/types';
export declare function getDefaultCommandsMap(editorCommands?: CodyCommand[]): Map<string, CodyCommand>;
/**
 * Builds a map of CodyCommands with content from a JSON file.
 * @param type The type of commands being built.
 * @param fileContent The contents of the cody.json file.
 */
export declare function buildCodyCommandMap(type: CodyCommandType, fileContent: string): Map<string, CodyCommand>;
/**
 * Creates a CodyCommandArgs object with default values.
 * Generates a random requestID if one is not provided.
 * Merges any provided args with the defaults.
 */
export declare function newCodyCommandArgs(args?: Partial<CodyCommandArgs>): CodyCommandArgs;
//# sourceMappingURL=get-commands.d.ts.map