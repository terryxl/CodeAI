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
const vitest_1 = require("vitest");
const vscode = __importStar(require("vscode"));
const enhanced_context_status_1 = require("./enhanced-context-status");
class TestProvider {
    status_;
    emitter = new vscode.EventEmitter();
    constructor(status_ = undefined) {
        this.status_ = status_;
    }
    onDidChangeStatus(callback) {
        return this.emitter.event(callback);
    }
    get status() {
        return (this.status_ || [
            {
                displayName: 'github.com/foo/bar',
                providers: [
                    {
                        kind: 'embeddings',
                        state: 'unconsented',
                    },
                ],
            },
        ]);
    }
    set status(status) {
        this.status_ = status;
    }
}
(0, vitest_1.describe)('ContextStatusAggregator', () => {
    (0, vitest_1.it)('should fire status changed when providers are added and pass through simple status', async () => {
        const aggregator = new enhanced_context_status_1.ContextStatusAggregator();
        const promise = new Promise(resolve => {
            aggregator.onDidChangeStatus(provider => resolve(provider.status));
        });
        aggregator.addProvider(new TestProvider());
        (0, vitest_1.expect)(await promise).toEqual([
            {
                displayName: 'github.com/foo/bar',
                providers: [
                    {
                        kind: 'embeddings',
                        state: 'unconsented',
                    },
                ],
            },
        ]);
        aggregator.dispose();
    });
    (0, vitest_1.it)('should fire aggregate status from multiple providers', async () => {
        const aggregator = new enhanced_context_status_1.ContextStatusAggregator();
        let callbackCount = 0;
        const promise = new Promise(resolve => {
            aggregator.onDidChangeStatus(provider => {
                callbackCount++;
                resolve(provider.status);
            });
        });
        aggregator.addProvider(new TestProvider());
        aggregator.addProvider(new TestProvider([
            {
                displayName: 'host.example/foo',
                providers: [{ kind: 'search', type: 'local', state: 'ready' }],
            },
            {
                displayName: 'github.com/foo/bar',
                providers: [
                    {
                        kind: 'search',
                        type: 'remote',
                        state: 'ready',
                        id: 'quux',
                        inclusion: 'manual',
                    },
                ],
            },
        ]));
        (0, vitest_1.expect)(await promise).toEqual([
            {
                displayName: 'github.com/foo/bar',
                providers: [
                    {
                        kind: 'embeddings',
                        state: 'unconsented',
                    },
                    {
                        kind: 'search',
                        type: 'remote',
                        state: 'ready',
                        id: 'quux',
                        inclusion: 'manual',
                    },
                ],
            },
            {
                displayName: 'host.example/foo',
                providers: [{ kind: 'search', type: 'local', state: 'ready' }],
            },
        ]);
        // Not only does it aggregate status, it coalesces update events
        (0, vitest_1.expect)(callbackCount).toBe(1);
        aggregator.dispose();
    });
    (0, vitest_1.it)('should respond to child events by firing an event of its own', async () => {
        const aggregator = new enhanced_context_status_1.ContextStatusAggregator();
        const provider = new TestProvider();
        aggregator.addProvider(provider);
        // Skip the first update event.
        await Promise.resolve();
        let callbackCount = 0;
        const promise = new Promise(resolve => {
            aggregator.onDidChangeStatus(provider => {
                callbackCount++;
                resolve(provider.status);
            });
        });
        provider.status = [
            {
                displayName: 'github.com/foo/bar',
                providers: [{ kind: 'search', type: 'local', state: 'indexing' }],
            },
        ];
        provider.emitter.fire(provider);
        (0, vitest_1.expect)(await promise).toEqual([
            {
                displayName: 'github.com/foo/bar',
                providers: [
                    {
                        kind: 'search',
                        type: 'local',
                        state: 'indexing',
                    },
                ],
            },
        ]);
        (0, vitest_1.expect)(callbackCount).toBe(1);
    });
});
