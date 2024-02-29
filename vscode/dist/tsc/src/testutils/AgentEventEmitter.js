"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentEventEmitter = void 0;
const Disposable_1 = require("./Disposable");
function invokeCallback(callback, arg) {
    return callback.thisArg ? callback.handler.bind(callback.thisArg)(arg) : callback.handler(arg);
}
/**
 * Implementation of `vscode.EventEmitter` with a single modification: there's
 * an additional `cody_fireAsync()` method to await on fired events. This functionality
 * is necessary for the agent to be able to reliably know when configuration changes
 * have finished propagating through the extension.
 */
class AgentEventEmitter {
    on = () => undefined;
    constructor() {
        this.on = () => undefined;
    }
    listeners = new Set();
    event = (listener, thisArgs) => {
        const value = { handler: listener, thisArg: thisArgs };
        this.listeners.add(value);
        return new Disposable_1.Disposable(() => {
            this.listeners.delete(value);
        });
    };
    fire(data) {
        for (const listener of this.listeners) {
            invokeCallback(listener, data);
        }
    }
    /**
     * Custom extension of the VS Code API to make it possible to `await` on the
     * result of `EventEmitter.fire()`.  Most event listeners return a
     * meaningful `Promise` that is discarded in the signature of the `fire()`
     * function.  Being able to await on returned promise makes it possible to
     * write more robust tests because we don't need to rely on magic timeouts.
     */
    async cody_fireAsync(data) {
        const promises = [];
        for (const listener of this.listeners) {
            const value = invokeCallback(listener, data);
            promises.push(Promise.resolve(value));
        }
        await Promise.all(promises);
    }
    dispose() {
        this.listeners.clear();
    }
}
exports.AgentEventEmitter = AgentEventEmitter;
