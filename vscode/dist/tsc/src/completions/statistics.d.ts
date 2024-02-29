interface CompletionStatistics {
    suggested: number;
    accepted: number;
}
export declare function getStatistics(): CompletionStatistics;
export declare function logSuggested(): void;
export declare function logAccepted(): void;
export declare const registerChangeListener: (listener: (value: void) => void) => () => void;
export {};
//# sourceMappingURL=statistics.d.ts.map