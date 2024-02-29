import type { CodyCommandArgs } from '../types';
import type { ChatCommandResult } from '../../main';
/**
 * Executes the /test command for generating unit tests in Chat for selected code.
 *
 * NOTE: Currently used by agent until inline test command is added to agent.
 */
export declare function executeTestChatCommand(args?: Partial<CodyCommandArgs>): Promise<ChatCommandResult | undefined>;
//# sourceMappingURL=test-chat.d.ts.map