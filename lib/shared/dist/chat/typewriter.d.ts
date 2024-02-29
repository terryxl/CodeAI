interface IncrementalTextConsumer {
    /**
     * Push new text to the consumer.
     * Text should be incremental but still include the previous text. E.g. "Hel" -> "Hello" -> "Hello, world!"
     */
    update: (content: string) => void;
    /**
     * Notify the consumer that the text is complete.
     */
    close: () => void;
    /**
     * Notify the consumer about an error.
     */
    error?: (error: Error) => void;
}
/**
 * Typewriter class that implements the IncrementalTextConsumer interface.
 * Used to simulate a typing effect by providing text incrementally.
 */
export declare class Typewriter implements IncrementalTextConsumer {
    private readonly consumer;
    private upstreamClosed;
    private text;
    private i;
    private interval;
    /**
     * Creates a Typewriter which will buffer incremental text and pass it
     * through to `consumer` simulating a typing effect.
     * @param consumer the consumer to pipe "typing" through to.
     */
    constructor(consumer: IncrementalTextConsumer);
    update(content: string): void;
    close(): void;
    /** Stop the typewriter, immediately emit any remaining text */
    stop(error?: Error): void;
}
export {};
//# sourceMappingURL=typewriter.d.ts.map