/**
 * Processes the part of a response from Cody addressed to a specific topic.
 */
export interface BotResponseSubscriber {
    /**
     * Processes incremental content from the bot. This may be called multiple times during a turn.
     * @param content the incremental text from the bot that was addressed to the subscriber
     */
    onResponse(content: string): Promise<void>;
    /**
     * Notifies the subscriber that a turn has completed.
     */
    onTurnComplete(): Promise<void>;
}
/**
 * Incrementally consumes a response from the bot, breaking out parts addressing
 * different topics and forwarding those parts to a registered subscriber, if any.
 */
export declare class BotResponseMultiplexer {
    /**
     * The default topic. Messages without a specific topic are sent to the default
     * topic subscriber, if any.
     */
    static readonly DEFAULT_TOPIC = "Assistant";
    private static readonly TOPIC_RE;
    private subs_;
    private topics_;
    private get currentTopic();
    private buffer_;
    private publishInProgress_;
    /**
     * Subscribes to a topic in the bot response. Each topic can have only one subscriber at a time. New subscribers overwrite old ones.
     * @param topic the string prefix to subscribe to.
     * @param subscriber the handler for the content produced by the bot.
     */
    sub(topic: string, subscriber: BotResponseSubscriber): void;
    /**
     * Notifies all subscribers that the bot response is complete.
     */
    notifyTurnComplete(): Promise<void>;
    /**
     * Parses part of a compound response from the bot and forwards as much as possible to
     * subscribers.
     * @param response the text of the next incremental response from the bot.
     */
    publish(response: string): Promise<void>;
    private publishStep;
    private publishBufferUpTo;
    private publishInTopic;
}
//# sourceMappingURL=bot-response-multiplexer.d.ts.map