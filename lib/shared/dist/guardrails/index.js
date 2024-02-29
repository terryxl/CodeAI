import { pluralize } from '../common';
import { isError } from '../utils';
// 10s timeout is enough to serve most attribution requests.
// It's a better user experience for chat attribution to wait
// a few seconds more and get attribution result.
const timeout = 10000;
// GuardrailsPost implements Guardrails interface by synchronizing on message
// passing between webview and extension process.
export class GuardrailsPost {
    postSnippet;
    currentRequests = new Map();
    constructor(postSnippet) {
        this.postSnippet = postSnippet;
    }
    searchAttribution(snippet) {
        let request = this.currentRequests.get(snippet);
        if (request === undefined) {
            request = new AttributionSearchSync();
            this.currentRequests.set(snippet, request);
            this.postSnippet(snippet);
            // Timeout in case anything goes wrong on the extension side.
            setTimeout(() => {
                this.notifyAttributionFailure(snippet, new Error('Timed out.'));
            }, timeout);
        }
        return request.promise;
    }
    notifyAttributionSuccess(snippet, result) {
        const request = this.currentRequests.get(snippet);
        if (request !== undefined) {
            this.currentRequests.delete(snippet);
            request.resolve(result);
        }
        // Do nothing in case there the message is not for an ongoing request.
    }
    notifyAttributionFailure(snippet, error) {
        const request = this.currentRequests.get(snippet);
        if (request !== undefined) {
            this.currentRequests.delete(snippet);
            request.reject(error);
        }
        // Do nothing in case there the message is not for an ongoing request.
    }
}
// AttributionSearchSync provides syncronization for webview / extension messages
// in form of a Promise API for a single search.
class AttributionSearchSync {
    promise;
    resolve;
    reject;
    constructor() {
        this.promise = new Promise((resolve, reject) => {
            this.resolve = resolve;
            this.reject = reject;
        });
    }
}
export function summariseAttribution(attribution) {
    if (isError(attribution)) {
        return `guardrails attribution search failed: ${attribution.message}`;
    }
    const repos = attribution.repositories;
    const count = repos.length;
    if (count === 0) {
        return 'no matching repositories found';
    }
    const summary = repos.slice(0, count < 5 ? count : 5).map(repo => repo.name);
    if (count > 5) {
        summary.push('...');
    }
    return `found ${count}${attribution.limitHit ? '+' : ''} matching ${pluralize('repository', count, 'repositories')} ${summary.join(', ')}`;
}
//# sourceMappingURL=index.js.map