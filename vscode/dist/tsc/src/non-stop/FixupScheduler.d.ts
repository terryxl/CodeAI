import type { FixupIdleTaskRunner } from './roles';
/**
 * Runs callbacks "later".
 */
export declare class FixupScheduler implements FixupIdleTaskRunner {
    private work_;
    private timeout_;
    private scheduled_;
    constructor(delayMsec: number);
    /**
     * Schedules a callback which will run when the event loop is idle.
     * @param worker the callback to run.
     */
    scheduleIdle<T>(worker: () => T): Promise<T>;
    private scheduleCallback;
    doWorkNow(): void;
}
//# sourceMappingURL=FixupScheduler.d.ts.map