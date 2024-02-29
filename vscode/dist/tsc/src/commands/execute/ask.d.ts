import type { ChatSession } from '../../chat/chat-view/SimpleChatPanelProvider';
import type { WebviewSubmitMessage } from '../../chat/protocol';
import { type ChatEventSource } from '@sourcegraph/cody-shared';
export interface ExecuteChatArguments extends WebviewSubmitMessage {
    source?: ChatEventSource;
}
/**
 * Wrapper around the `cody.action.chat` command that can be used anywhere but with better type-safety.
 * This is also called by all the default chat commands (e.g. /explain, /smell).
 */
export declare const executeChat: (args: ExecuteChatArguments) => Promise<ChatSession | undefined>;
//# sourceMappingURL=ask.d.ts.map