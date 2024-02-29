import { type ExecuteChatArguments } from './ask';
import type { ChatCommandResult } from '../../main';
import type { CodyCommandArgs } from '../types';
import type { Span } from '@opentelemetry/api';
/**
 * Generates the prompt and context files with arguments for the 'smell' command.
 *
 * Context: Current selection
 */
export declare function smellCommand(span: Span, args?: Partial<CodyCommandArgs>): Promise<ExecuteChatArguments>;
/**
 * Executes the smell command as a chat command via 'cody.action.chat'
 */
export declare function executeSmellCommand(args?: Partial<CodyCommandArgs>): Promise<ChatCommandResult | undefined>;
//# sourceMappingURL=smell.d.ts.map