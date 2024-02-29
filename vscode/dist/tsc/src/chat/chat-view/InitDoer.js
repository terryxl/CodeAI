"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InitDoer = void 0;
const lodash_1 = require("lodash");
/**
 * Accepts actions that should block on initialization. If invoked before initialization, queues
 * the actions to be invoked upon initialization.
 */
class InitDoer {
    onInitTodos = [];
    isInitialized = false;
    signalInitialized() {
        if (this.isInitialized) {
            return;
        }
        {
            // This block must execute synchronously, because this.isInitialized
            // and this.onInitTodos must be updated atomically.
            this.isInitialized = true;
            for (const { todo, onDone, onError } of this.onInitTodos) {
                try {
                    Promise.resolve(todo()).then(onDone, onError);
                }
                catch (error) {
                    onError((0, lodash_1.isError)(error) ? error : new Error(`${error}`));
                }
            }
            this.onInitTodos = [];
        }
    }
    do(todo) {
        if (this.isInitialized) {
            return Promise.resolve(todo());
        }
        return new Promise((resolve, reject) => {
            // Check again if we're initialized now
            if (this.isInitialized) {
                Promise.resolve(todo()).then(result => resolve(result), error => reject(error));
                return;
            }
            // Not yet initialized, add it to the queue
            this.onInitTodos.push({
                todo,
                onDone: result => resolve(result),
                onError: error => reject(error),
            });
        });
    }
}
exports.InitDoer = InitDoer;
