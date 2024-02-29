export interface Attribution {
    limitHit: boolean;
    repositories: RepositoryAttribution[];
}
interface RepositoryAttribution {
    name: string;
}
export interface Guardrails {
    searchAttribution(snippet: string): Promise<Attribution | Error>;
}
export declare class GuardrailsPost implements Guardrails {
    private postSnippet;
    private currentRequests;
    constructor(postSnippet: (txt: string) => void);
    searchAttribution(snippet: string): Promise<Attribution>;
    notifyAttributionSuccess(snippet: string, result: Attribution): void;
    notifyAttributionFailure(snippet: string, error: Error): void;
}
export declare function summariseAttribution(attribution: Attribution | Error): string;
export {};
//# sourceMappingURL=index.d.ts.map