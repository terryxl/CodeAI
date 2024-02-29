import type { CodyCommandArgs } from './types';
import type { CommandsProvider } from './services/provider';
import type { CommandResult } from '../main';
export declare const setCommandController: (provider?: CommandsProvider) => void;
/**
 * Binds the execute method of the CommandsController instance to be exported as a constant function.
 * This allows the execute method to be called without needing a reference to the controller instance.
 */
export declare const executeCodyCommand: (input: string, args: CodyCommandArgs) => Promise<CommandResult | undefined>;
//# sourceMappingURL=CommandsController.d.ts.map