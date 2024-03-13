import { wrapInActiveSpan } from '@sourcegraph/cody-shared'
import type { Message, MessageAzure } from '@sourcegraph/cody-shared'
import { logDebug } from '../../log'

import type { MessageWithContext, SimpleChatModel } from './SimpleChatModel'
import { PromptBuilder } from '../../prompt-builder'
import type { ContextItem } from '../../prompt-builder/types'
import { sortContextItems } from './agentContextSorting'
import type { IPrompter } from './prompt'

const ENHANCED_CONTEXT_ALLOCATION = 0.6 // Enhanced context should take up 60% of the context window

export class AzuerPrompter implements IPrompter<MessageAzure> {
    constructor(
        private explicitContext: ContextItem[],
        private submitType?: string,
        private getEnhancedContext?: (query: string, charLimit: number) => Promise<ContextItem[]>
    ) {}
    // Constructs the raw prompt to send to the LLM, with message order reversed, so we can construct
    // an array with the most important messages (which appear most important first in the reverse-prompt.
    //
    // Returns the reverse prompt and the new context that was used in the
    // prompt for the current message.
    public async makePrompt(
        chat: SimpleChatModel,
        charLimit: number
    ): Promise<{
        prompt: MessageAzure[]
        newContextUsed: ContextItem[]
    }> {
        return wrapInActiveSpan('chat.prompter', async () => {
            const enhancedContextCharLimit = Math.floor(charLimit * ENHANCED_CONTEXT_ALLOCATION)
            const promptBuilder = new PromptBuilder(charLimit)
            const newContextUsed: ContextItem[] = []

            // Add existing transcript messages
            const reverseTranscript: MessageWithContext[] = [...chat.getMessagesWithContext()].reverse()
            for (let i = 0; i < reverseTranscript.length; i++) {
                const messageWithContext = reverseTranscript[i]
                const contextLimitReached = promptBuilder.tryAdd(messageWithContext.message)
                if (!contextLimitReached) {
                    logDebug(
                        'DefaultPrompter.makePrompt',
                        `Ignored ${
                            reverseTranscript.length - i
                        } transcript messages due to context limit`
                    )
                    return {
                        prompt: this.transfer(promptBuilder.build()),
                        newContextUsed,
                    }
                }
            }

            {
                // Add context from new user-specified context items
                const { limitReached, used } = promptBuilder.tryAddContext(this.explicitContext)
                newContextUsed.push(...used)
                if (limitReached) {
                    logDebug(
                        'DefaultPrompter.makePrompt',
                        'Ignored current user-specified context items due to context limit'
                    )
                    return { prompt: this.transfer(promptBuilder.build()), newContextUsed }
                }
            }

            // TODO(beyang): Decide whether context from previous messages is less
            // important than user added context, and if so, reorder this.
            {
                // Add context from previous messages
                const { limitReached } = promptBuilder.tryAddContext(
                    reverseTranscript.flatMap(
                        (message: MessageWithContext) => message.newContextUsed || []
                    )
                )
                if (limitReached) {
                    logDebug(
                        'DefaultPrompter.makePrompt',
                        'Ignored prior context items due to context limit'
                    )
                    return { prompt: this.transfer(promptBuilder.build()), newContextUsed }
                }
            }

            const lastMessage = reverseTranscript[0]
            if (!lastMessage?.message.text) {
                throw new Error('No last message or last message text was empty')
            }
            if (lastMessage.message.speaker === 'assistant') {
                throw new Error('Last message in prompt needs speaker "human", but was "assistant"')
            }
            if (this.getEnhancedContext) {
                // Add additional context from current editor or broader search
                const additionalContextItems = await this.getEnhancedContext(
                    lastMessage.message.text,
                    enhancedContextCharLimit
                )
                sortContextItems(additionalContextItems)
                const { limitReached, used, ignored } = promptBuilder.tryAddContext(
                    additionalContextItems,
                    enhancedContextCharLimit
                )
                newContextUsed.push(...used)
                if (limitReached) {
                    logDebug(
                        'DefaultPrompter.makePrompt',
                        `Ignored ${ignored.length} additional context items due to limit reached`
                    )
                }
            }

            return {
                prompt: this.transfer(promptBuilder.build()),
                newContextUsed,
            }
        })
    }

    private transfer(msg: Message[]): MessageAzure[] {
        return (msg || []).reduce((acc: MessageAzure[], curr: Message) => {
            acc.push({
                role: curr.speaker && curr.speaker === 'assistant' ? curr.speaker : this.submitType === 'user-newchat' ? 'system' : 'user',
                content: curr.text
            })
            return acc;
          }, []);
    }
}
