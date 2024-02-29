import { DefaultChatCommands, type DefaultCodyCommands, DefaultEditCommands } from '@sourcegraph/cody-shared/src/commands/types';
import type { CommandResult } from '../../main';
export { commands as defaultCommands } from './cody.json';
export { executeSmellCommand } from './smell';
export { executeExplainCommand } from './explain';
export { executeTestChatCommand } from './test-chat';
export { executeDocCommand } from './doc';
export { executeTestEditCommand } from './test-edit';
export { executeTestCaseEditCommand } from './test-case';
export { executeExplainOutput } from './terminal';
export declare function isDefaultChatCommand(id: string): DefaultChatCommands | undefined;
export declare function isDefaultEditCommand(id: string): DefaultEditCommands | undefined;
/**
 * Executes the default command based on the given arguments.
 * Handles mapping chat commands and edit commands to their respective handler functions.
 * Returns the command result if a matched command is found, otherwise returns undefined.
 */
export declare function executeDefaultCommand(id: DefaultCodyCommands | string, additionalInstruction?: string): Promise<CommandResult | undefined>;
//# sourceMappingURL=index.d.ts.map