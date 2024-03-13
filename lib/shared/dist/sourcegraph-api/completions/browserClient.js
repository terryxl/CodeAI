import { fetchEventSource } from '@microsoft/fetch-event-source';
import { dependentAbortController } from '../../common/abortController';
import { addCustomUserAgent } from '../graphql/client';
import { SourcegraphCompletionsClient } from './client';
export class SourcegraphBrowserCompletionsClient extends SourcegraphCompletionsClient {
    _streamWithCallbacks(params, cb, signal) {
        this.completions = [];
        const abort = dependentAbortController(signal);
        const headersInstance = new Headers(this.config.customHeaders);
        addCustomUserAgent(headersInstance);
        headersInstance.set('Content-Type', 'application/json; charset=utf-8');
        let payload = params;
        if (params.vendor === 'Azure') {
            payload = { messages: params.messages, stream: true };
            this.config.accessToken && headersInstance.set('Api-Key', this.config.accessToken);
        }
        else {
            this.config.accessToken && headersInstance.set('Authorization', `token ${this.config.accessToken}`);
        }
        const parameters = new URLSearchParams(window.location.search);
        const trace = parameters.get('trace');
        if (trace) {
            headersInstance.set('X-Sourcegraph-Should-Trace', 'true');
        }
        // Disable gzip compression since the sg instance will start to batch
        // responses afterwards.
        headersInstance.set('Accept-Encoding', 'gzip;q=0');
        fetchEventSource(this.completionsEndpoint, {
            method: 'POST',
            headers: Object.fromEntries(headersInstance.entries()),
            body: JSON.stringify(payload),
            signal: abort.signal,
            openWhenHidden: isRunningInWebWorker, // otherwise tries to call document.addEventListener
            async onopen(response) {
                if (!response.ok && response.headers.get('content-type') !== 'text/event-stream') {
                    let errorMessage = null;
                    try {
                        errorMessage = await response.text();
                    }
                    catch (error) {
                        // We show the generic error message in this case
                        console.error(error);
                    }
                    const error = new Error(errorMessage === null || errorMessage.length === 0
                        ? `Request failed with status code ${response.status}`
                        : errorMessage);
                    cb.onError(error, response.status);
                    abort.abort();
                    return;
                }
            },
            onmessage: message => {
                try {
                    const data = this.formatCompletion({ ...JSON.parse(message.data), type: message.event });
                    this.sendEvents([data], cb);
                }
                catch (error) {
                    cb.onError(error.message);
                    abort.abort();
                    console.error(error);
                    // throw the error for not retrying
                    throw error;
                }
            },
            onerror(error) {
                cb.onError(error.message);
                abort.abort();
                console.error(error);
                // throw the error for not retrying
                throw error;
            },
        }).catch(error => {
            cb.onError(error.message);
            abort.abort();
            console.error(error);
        });
    }
}
const isRunningInWebWorker = typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope;
if (isRunningInWebWorker) {
    // HACK: @microsoft/fetch-event-source tries to call document.removeEventListener, which is not
    // available in a worker.
    ;
    self.document = { removeEventListener: () => { } };
}
//# sourceMappingURL=browserClient.js.map