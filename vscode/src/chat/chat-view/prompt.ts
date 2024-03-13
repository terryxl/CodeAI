import * as vscode from 'vscode'

import { getSimplePreamble, wrapInActiveSpan, type Message } from '@sourcegraph/cody-shared'

import { logDebug } from '../../log'

import type { MessageWithContext, SimpleChatModel } from './SimpleChatModel'
import { PromptBuilder } from '../../prompt-builder'
import type { ContextItem } from '../../prompt-builder/types'
import { sortContextItems } from './agentContextSorting'

export interface PromptInfo<T = Message> {
    prompt: T[]
    newContextUsed?: ContextItem[]
}

export interface IPrompter<T = Message> {
    makePrompt(chat: SimpleChatModel, charLimit?: number): Promise<PromptInfo<T>>
}

const ENHANCED_CONTEXT_ALLOCATION = 0.6 // Enhanced context should take up 60% of the context window

export class CommandPrompter implements IPrompter {
    constructor(private getContextItems: (maxChars: number) => Promise<ContextItem[]>) {}
    public async makePrompt(chat: SimpleChatModel, charLimit: number): Promise<PromptInfo> {
        const enhancedContextCharLimit = Math.floor(charLimit * ENHANCED_CONTEXT_ALLOCATION)
        const promptBuilder = new PromptBuilder(charLimit)
        const newContextUsed: ContextItem[] = []
        const preInstruction: string | undefined = vscode.workspace
            .getConfiguration('cody.chat')
            .get('preInstruction')

        const preambleMessages = getSimplePreamble(preInstruction)
        const preambleSucceeded = promptBuilder.tryAddToPrefix(preambleMessages)
        if (!preambleSucceeded) {
            throw new Error(`Preamble length exceeded context window size ${charLimit}`)
        }

        // Add existing transcript messages
        const reverseTranscript: MessageWithContext[] = [...chat.getMessagesWithContext()].reverse()
        for (let i = 0; i < reverseTranscript.length; i++) {
            const messageWithContext = reverseTranscript[i]
            const contextLimitReached = promptBuilder.tryAdd(messageWithContext.message)
            if (!contextLimitReached) {
                logDebug(
                    'CommandPrompter.makePrompt',
                    `Ignored ${reverseTranscript.length - i} transcript messages due to context limit`
                )
                return {
                    prompt: promptBuilder.build(),
                    newContextUsed,
                }
            }
        }

        const contextItems = await this.getContextItems(enhancedContextCharLimit)
        const { limitReached, used, ignored } = promptBuilder.tryAddContext(
            contextItems,
            enhancedContextCharLimit
        )
        newContextUsed.push(...used)
        if (limitReached) {
            // TODO(beyang): we're masking this error (repro: try /explain),
            // we should improve the commands context selection process
            logDebug(
                'CommandPrompter',
                'makePrompt',
                `context limit reached, ignored ${ignored.length} items`
            )
        }

        return {
            prompt: promptBuilder.build(),
            newContextUsed,
        }
    }
}

export class DefaultPrompter implements IPrompter {
    constructor(
        private explicitContext: ContextItem[],
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
        prompt: Message[]
        newContextUsed: ContextItem[]
    }> {
        return wrapInActiveSpan('chat.prompter', async () => {
            const enhancedContextCharLimit = Math.floor(charLimit * ENHANCED_CONTEXT_ALLOCATION)
            const promptBuilder = new PromptBuilder(charLimit)
            const newContextUsed: ContextItem[] = []
            const preInstruction: string | undefined = vscode.workspace
                .getConfiguration('cody.chat')
                .get('preInstruction')

            const preambleMessages = getSimplePreamble(preInstruction)
            const preambleSucceeded = promptBuilder.tryAddToPrefix(preambleMessages)
            if (!preambleSucceeded) {
                throw new Error(`Preamble length exceeded context window size ${charLimit}`)
            }

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
                        prompt: promptBuilder.build(),
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
                    return { prompt: promptBuilder.build(), newContextUsed }
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
                    return { prompt: promptBuilder.build(), newContextUsed }
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
                prompt: promptBuilder.build(),
                newContextUsed,
            }
        })
    }
}
