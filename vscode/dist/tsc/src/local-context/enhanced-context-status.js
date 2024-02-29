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
exports.ContextStatusAggregator = void 0;
const vscode = __importStar(require("vscode"));
const log_1 = require("../log");
// Collects context status from a set of ContextStatusProviders and produces
// a merged status view.
class ContextStatusAggregator {
    static TAG = 'ContextStatusAggregator';
    disposables = new Set();
    statusEmitter = new vscode.EventEmitter();
    providerStatusMap = new Map();
    // Whether we have been notified of status changes, but are yet to pass that
    // notification on. We do this to de-bounce updates from multiple status
    // providers in one turn of the event loop.
    pendingPublish = false;
    // Disposes this ContextStatusAggregator.
    dispose() {
        for (const disposable of this.disposables) {
            disposable.dispose();
        }
        this.providerStatusMap = undefined;
    }
    // Adds a provider to this ContextStatusAggregator. The aggregator will
    // subscribe to the provider and aggregate its updates into a merged status.
    // To remove this provider, dispose of the returned disposable.
    //
    // If the provider is disposable, it should dispose of the registration in
    // its dispose method. Otherwise this ContextStatusAggregator may continue
    // to poll its status property, and show its status in the aggregate status.
    addProvider(provider) {
        if (this.providerStatusMap === undefined) {
            throw new Error('ContextStatusPublisher has been disposed');
        }
        const disposable = provider.onDidChangeStatus(putativeProvider => {
            if (provider !== putativeProvider) {
                (0, log_1.logDebug)(ContextStatusAggregator.TAG, 'got onDidChangeStatus event but passed mismatched provider');
            }
            this.providerDidChangeStatus(provider);
        });
        this.disposables.add(disposable);
        this.providerStatusMap.set(provider, 'needs-status');
        this.providerDidChangeStatus(provider);
        return {
            dispose: () => {
                if (this.providerStatusMap) {
                    this.providerStatusMap.delete(provider);
                    this.disposables.delete(disposable);
                    disposable.dispose();
                    this.publishStatus();
                }
            },
        };
    }
    // Records that the provider's state is dirty, and schedules an update.
    providerDidChangeStatus(provider) {
        if (this.providerStatusMap === undefined) {
            // We have been disposed
            return;
        }
        if (!this.providerStatusMap.has(provider)) {
            // The provider has been removed. This should not happen if the
            // providers are following the dispose protocol.
            return;
        }
        // Record that we need to get provider status next update.
        this.providerStatusMap.set(provider, 'needs-status');
        // Schedule an update.
        this.publishStatus();
    }
    // Aggregates and publishes status asynchronously. Multiple context status
    // providers updating "at once" will be coalesced into one update.
    publishStatus() {
        if (this.pendingPublish) {
            // Coalesce multiple updates.
            return;
        }
        this.pendingPublish = true;
        void Promise.resolve().then(() => {
            this.pendingPublish = false;
            this.statusEmitter.fire(this);
        });
    }
    // ContextStatusProvider implementation of onDidChangeStatus. The
    // ContextStatusAggregator can be stacked to combine per-workspace and
    // per-chat context status.
    onDidChangeStatus(callback) {
        return this.statusEmitter.event(callback);
    }
    // Computes the merged context status. This may throw if any of the
    // aggregated providers' status throw.
    get status() {
        if (this.providerStatusMap === undefined) {
            throw new Error('ContextStatusPublisher has been disposed');
        }
        const groupBy = {};
        // Iterate through provider status map entries
        for (let [provider, status] of this.providerStatusMap.entries()) {
            if (status === 'needs-status') {
                // The provider's status is stale; poll it.
                status = provider.status;
                if (this.providerStatusMap.get(provider) !== 'needs-status') {
                    (0, log_1.logDebug)(ContextStatusAggregator.TAG, 'ContextStatusProvider.status should only report status, not change state', provider);
                }
                // Deep clone the status object so providers can't continue to change it without notifying.
                status = JSON.parse(JSON.stringify(status));
                // Cache the status so we don't re-poll this provider unless it changes.
                this.providerStatusMap.set(provider, status);
            }
            // Collect context groups by name
            for (const group of status) {
                if (group.displayName in groupBy) {
                    // Merge the items in the group.
                    groupBy[group.displayName].providers.push(...group.providers);
                }
                else {
                    // Create a new group for the merged result.
                    groupBy[group.displayName] = {
                        displayName: group.displayName,
                        providers: [...group.providers],
                    };
                }
            }
        }
        // Order sources within the groups by a canonical order
        for (const groups of Object.values(groupBy)) {
            // Sort by a fixed locale for consistency. The 'kind' key is not a
            // localized UI label.
            groups.providers.sort((a, b) => a.kind.localeCompare(b.kind, 'en-US'));
        }
        return [...Object.values(groupBy)];
    }
}
exports.ContextStatusAggregator = ContextStatusAggregator;
