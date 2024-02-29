import { type ExecuteChatArguments } from './ask';
import type { ChatCommandResult } from '../../main';
import type { CodyCommandArgs } from '../types';
import type { Span } from '@opentelemetry/api';
/**
 * Generates the prompt and context files with arguments for the 'explain' command.
 *
 * Context: Current selection and current file
 */
export declare function explainCommand(span: Span, args?: Partial<CodyCommandArgs>): Promise<ExecuteChatArguments>;
/**
 * Executes the explain command as a chat command via 'cody.action.chat'
 */
export declare function executeExplainCommand(args?: Partial<CodyCommandArgs>): Promise<ChatCommandResult | undefined>;
//# sourceMappingURL=explain.d.ts.map