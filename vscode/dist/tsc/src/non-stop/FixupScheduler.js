"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FixupScheduler = void 0;
/**
 * Runs callbacks "later".
 */
class FixupScheduler {
    work_ = [];
    timeout_;
    scheduled_ = false;
    constructor(delayMsec) {
        this.timeout_ = setTimeoutCompat(this.doWorkNow.bind(this), delayMsec).unref();
    }
    // TODO: Consider making this disposable and not running tasks after
    // being disposed
    // TODO: Add a callback so the scheduler knows when the user is typing
    // and add a cooldown period
    /**
     * Schedules a callback which will run when the event loop is idle.
     * @param worker the callback to run.
     */
    scheduleIdle(worker) {
        if (!this.work_.length) {
            // First work item, so schedule the window callback
            this.scheduleCallback();
        }
        return new Promise((resolve, reject) => {
            this.work_.push(() => {
                try {
                    resolve(worker());
                }
                catch (error) {
                    reject(error);
                }
            });
        });
    }
    scheduleCallback() {
        if (!this.scheduled_) {
            this.scheduled_ = true;
            this.timeout_.refresh();
        }
    }
    doWorkNow() {
        this.scheduled_ = false;
        const item = this.work_.shift();
        if (!item) {
            return;
        }
        if (this.work_.length) {
            this.scheduleCallback();
        }
        item();
    }
}
exports.FixupScheduler = FixupScheduler;
/**
 * No-op wrapper for Node.js `setTimeout` or a compatibility wrapper for DOM `setTimeout`.
 */
function setTimeoutCompat(callback, delayMsec) {
    const handle = setTimeout(callback, delayMsec);
    if (typeof handle === 'number') {
        let latestHandle = handle;
        const compatHandle = {
            refresh() {
                clearTimeout(latestHandle);
                latestHandle = setTimeout(callback, delayMsec);
            },
            unref() {
                // noop
                return compatHandle;
            },
        };
        return compatHandle;
    }
    return handle;
}
