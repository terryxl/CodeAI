import { type Message } from '@sourcegraph/cody-shared';
export declare function messagesToText(messages: Message[]): string;
/**
 * Creates a new signal that forks a parent signal. When the parent signal is aborted, the forked
 * signal will be aborted as well. This allows propagating abort signals across asynchronous
 * operations.
 *
 * Aborting the forked controller however does not affect the parent.
 */
export declare function forkSignal(signal: AbortSignal): AbortController;
/**
 * Creates a simple subscriber that can be used to register callbacks
 */
type Listener<T> = (value: T) => void;
interface Subscriber<T> {
    subscribe(listener: Listener<T>): () => void;
    notify(value: T): void;
}
export declare function createSubscriber<T>(): Subscriber<T>;
export declare function zipGenerators<T>(generators: AsyncGenerator<T>[]): AsyncGenerator<T[]>;
export declare function generatorWithErrorObserver<T>(generator: AsyncGenerator<T>, errorObserver: (error: unknown) => void): AsyncGenerator<T>;
export declare function generatorWithTimeout<T>(generator: AsyncGenerator<T>, timeoutMs: number, abortController: AbortController): AsyncGenerator<T>;
export declare function sleep(ms: number): Promise<void>;
export {};
//# sourceMappingURL=utils.d.ts.map