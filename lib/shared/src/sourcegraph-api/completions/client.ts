import type { Span } from "@opentelemetry/api";
import type { ConfigurationWithAccessToken } from "../../configuration";
import type {
    CompletionCallbacks,
    CompletionGeneratorValue,
    CompletionParameters,
    CompletionResponse,
    Event,
} from "./types";
import { recordErrorToSpan } from "../../tracing";

export interface CompletionLogger {
    startCompletion(
        params: CompletionParameters | unknown,
        endpoint: string
    ):
        | undefined
        | {
              onError: (error: string, rawError?: unknown) => void;
              onComplete: (
                  response:
                      | string
                      | CompletionResponse
                      | string[]
                      | CompletionResponse[]
              ) => void;
              onEvents: (events: Event[]) => void;
          };
}

export type CompletionsClientConfig = Pick<
    ConfigurationWithAccessToken,
    "serverEndpoint" | "accessToken" | "debugEnable" | "customHeaders" | 'modelsVendor'
>;

/**
 * Access the chat based LLM APIs via a Sourcegraph server instance.
 *
 * 🚨 SECURITY: It is the caller's responsibility to ensure context from
 * all cody ignored files are removed before sending requests to the server.
 */
export abstract class SourcegraphCompletionsClient {
    private errorEncountered = false;
    public completions: string[] = []

    constructor(
        protected config: CompletionsClientConfig,
        protected logger?: CompletionLogger
    ) {}

    public onConfigurationChange(newConfig: CompletionsClientConfig): void {
        this.config = newConfig;
    }

    protected get completionsEndpoint(): string {
        if (this.config.modelsVendor === "Azure")
            return new URL(
                "/openai/deployments/gpt-4/chat/completions?api-version=2024-02-15-preview",
                this.config.serverEndpoint
            ).href;
        return new URL("/.api/completions/stream", this.config.serverEndpoint)
            .href;
    }

    protected sendEvents(
        events: Event[],
        cb: CompletionCallbacks,
        span?: Span
    ): void {
        for (const event of events) {
            switch (event.type) {
                case "completion": {
                    span?.addEvent("yield", { stopReason: event.stopReason });
                    cb.onChange(event.completion);
                    break;
                }
                case "error": {
                    const error = new Error(event.error);
                    if (span) {
                        recordErrorToSpan(span, error);
                    }
                    this.errorEncountered = true;
                    cb.onError(error);
                    this.completions = []
                    break;
                }
                case "done": {
                    if (!this.errorEncountered) {
                        cb.onComplete();
                    }
                    // reset errorEncountered for next request
                    this.errorEncountered = false;
                    this.completions = []
                    span?.end();
                    break;
                }
            }
        }
    }

    protected formatCompletion(obj: any): Event {
        if (this.config.modelsVendor !== "Azure") return obj
        const stopReason = obj?.choices?.[0]?.finish_reason || ''
        this.completions.push(obj?.choices?.[0]?.delta?.content || '')
        const res: Event = {
            type: stopReason ? 'done' : obj.type || 'completion',
            stopReason: '',
            completion: this.completions.join('')
        }
        return res
    }

    protected abstract _streamWithCallbacks(
        params: CompletionParameters,
        cb: CompletionCallbacks,
        signal?: AbortSignal
    ): void;

    public stream(
        params: CompletionParameters,
        signal?: AbortSignal
    ): AsyncGenerator<CompletionGeneratorValue> {
        // This is a technique to convert a function that takes callbacks to an async generator.

        const values: Promise<CompletionGeneratorValue>[] = [];
        let resolve: ((value: CompletionGeneratorValue) => void) | undefined;
        values.push(
            new Promise((r) => {
                resolve = r;
            })
        );

        const send = (value: CompletionGeneratorValue): void => {
            resolve!(value);
            values.push(
                new Promise((r) => {
                    resolve = r;
                })
            );
        };
        const callbacks: CompletionCallbacks = {
            onChange(text) {
                send({ type: "change", text });
            },
            onComplete() {
                send({ type: "complete" });
            },
            onError(error, statusCode) {
                send({ type: "error", error, statusCode });
            },
        };
        this._streamWithCallbacks(params, callbacks, signal);

        return (async function* () {
            for (let i = 0; ; i++) {
                const val = await values[i];
                delete values[i];
                yield val;
                if (val.type === "complete" || val.type === "error") {
                    break;
                }
            }
        })();
    }
}
