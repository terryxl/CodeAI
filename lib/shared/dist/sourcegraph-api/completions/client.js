import { recordErrorToSpan } from '../../tracing';
/**
 * Access the chat based LLM APIs via a Sourcegraph server instance.
 *
 * 🚨 SECURITY: It is the caller's responsibility to ensure context from
 * all cody ignored files are removed before sending requests to the server.
 */
export class SourcegraphCompletionsClient {
    config;
    logger;
    errorEncountered = false;
    constructor(config, logger) {
        this.config = config;
        this.logger = logger;
    }
    onConfigurationChange(newConfig) {
        this.config = newConfig;
    }
    get completionsEndpoint() {
        return new URL('/.api/completions/stream', this.config.serverEndpoint).href;
    }
    sendEvents(events, cb, span) {
        for (const event of events) {
            switch (event.type) {
                case 'completion': {
                    span?.addEvent('yield', { stopReason: event.stopReason });
                    cb.onChange(event.completion);
                    break;
                }
                case 'error': {
                    const error = new Error(event.error);
                    if (span) {
                        recordErrorToSpan(span, error);
                    }
                    this.errorEncountered = true;
                    cb.onError(error);
                    break;
                }
                case 'done': {
                    if (!this.errorEncountered) {
                        cb.onComplete();
                    }
                    // reset errorEncountered for next request
                    this.errorEncountered = false;
                    span?.end();
                    break;
                }
            }
        }
    }
    stream(params, signal) {
        // This is a technique to convert a function that takes callbacks to an async generator.
        const values = [];
        let resolve;
        values.push(new Promise(r => {
            resolve = r;
        }));
        const send = (value) => {
            resolve(value);
            values.push(new Promise(r => {
                resolve = r;
            }));
        };
        const callbacks = {
            onChange(text) {
                send({ type: 'change', text });
            },
            onComplete() {
                send({ type: 'complete' });
            },
            onError(error, statusCode) {
                send({ type: 'error', error, statusCode });
            },
        };
        this._streamWithCallbacks(params, callbacks, signal);
        return (async function* () {
            for (let i = 0;; i++) {
                const val = await values[i];
                delete values[i];
                yield val;
                if (val.type === 'complete' || val.type === 'error') {
                    break;
                }
            }
        })();
    }
}
//# sourceMappingURL=client.js.map