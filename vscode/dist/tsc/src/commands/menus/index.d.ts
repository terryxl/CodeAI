import type { CodyCommand } from '@sourcegraph/cody-shared';
import { type CustomCommandsBuilder } from './command-builder';
export declare function showCommandMenu(type: 'default' | 'custom' | 'config', customCommands: CodyCommand[]): Promise<void>;
/**
 * Show Menu for creating a new prompt via UI using the input box and quick pick without having to manually edit the cody.json file
 */
export declare function showNewCustomCommandMenu(commands: string[]): Promise<CustomCommandsBuilder | null>;
//# sourceMappingURL=index.d.ts.map