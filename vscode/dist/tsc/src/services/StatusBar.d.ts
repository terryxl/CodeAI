interface StatusBarError {
    title: string;
    description: string;
    errorType: StatusBarErrorName;
    onShow?: () => void;
    onSelect?: () => void;
}
export interface CodyStatusBar {
    dispose(): void;
    startLoading(label: string, params?: {
        timeoutMs: number;
    }): () => void;
    addError(error: StatusBarError): () => void;
    hasError(error: StatusBarErrorName): boolean;
}
type StatusBarErrorName = 'auth' | 'RateLimitError' | 'AutoCompleteDisabledByAdmin';
export declare function createStatusBar(): CodyStatusBar;
export {};
//# sourceMappingURL=StatusBar.d.ts.map