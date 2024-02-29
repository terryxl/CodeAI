"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sleep = exports.generatorWithTimeout = exports.generatorWithErrorObserver = exports.zipGenerators = exports.createSubscriber = exports.forkSignal = exports.messagesToText = void 0;
const anthropic = __importStar(require("@anthropic-ai/sdk"));
const cody_shared_1 = require("@sourcegraph/cody-shared");
function messagesToText(messages) {
    return messages
        .map(message => `${message.speaker === 'human' ? anthropic.HUMAN_PROMPT : anthropic.AI_PROMPT}${message.text === undefined ? '' : ` ${message.text}`}`)
        .join('');
}
exports.messagesToText = messagesToText;
/**
 * Creates a new signal that forks a parent signal. When the parent signal is aborted, the forked
 * signal will be aborted as well. This allows propagating abort signals across asynchronous
 * operations.
 *
 * Aborting the forked controller however does not affect the parent.
 */
function forkSignal(signal) {
    const controller = new AbortController();
    if (signal.aborted) {
        controller.abort();
    }
    signal.addEventListener('abort', () => controller.abort());
    return controller;
}
exports.forkSignal = forkSignal;
function createSubscriber() {
    const listeners = new Set();
    function subscribe(listener) {
        listeners.add(listener);
        return () => listeners.delete(listener);
    }
    function notify(value) {
        for (const listener of listeners) {
            listener(value);
        }
    }
    return {
        subscribe,
        notify,
    };
}
exports.createSubscriber = createSubscriber;
async function* zipGenerators(generators) {
    while (true) {
        const res = await Promise.all(generators.map(generator => generator.next()));
        if (res.every(r => r.done)) {
            return;
        }
        yield res.map(r => r.value);
    }
}
exports.zipGenerators = zipGenerators;
async function* generatorWithErrorObserver(generator, errorObserver) {
    try {
        while (true) {
            try {
                const res = await generator.next();
                if (res.done) {
                    return;
                }
                yield res.value;
            }
            catch (error) {
                errorObserver(error);
                throw error;
            }
        }
    }
    finally {
        // The return value is optional according to MDN
        // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/AsyncGenerator/return
        // @ts-ignore
        generator.return();
    }
}
exports.generatorWithErrorObserver = generatorWithErrorObserver;
async function* generatorWithTimeout(generator, timeoutMs, abortController) {
    try {
        if (timeoutMs === 0) {
            return;
        }
        const timeoutPromise = createTimeout(timeoutMs).finally(() => {
            abortController.abort();
        });
        while (true) {
            const { value, done } = await Promise.race([generator.next(), timeoutPromise]);
            if (value) {
                yield value;
            }
            if (done) {
                break;
            }
        }
    }
    finally {
        // The return value is optional according to MDN
        // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/AsyncGenerator/return
        // @ts-ignore
        generator.return();
    }
}
exports.generatorWithTimeout = generatorWithTimeout;
function createTimeout(timeoutMs) {
    return new Promise((_, reject) => setTimeout(() => reject(new cody_shared_1.TimeoutError('The request timed out')), timeoutMs));
}
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
exports.sleep = sleep;
