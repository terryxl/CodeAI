/**
 * Interface that mirrors the `logDebug` and `logError` functions in
 * vscode/src/log.ts but is available inside @sourcegraph/cody-shared.
 *
 * We should replace all usages of `console.{log,error,warn}` with calls to
 * these loggers instead. One motivation to do this is to expose more control to
 * all Cody clients over how messages get logged. For example, the JetBrains
 * plugin may want to display warnings/errors in a custom way.
 */
export interface CodyLogger {
    logDebug(filterLabel: string, text: string, ...args: unknown[]): void;
    logError(filterLabel: string, text: string, ...args: unknown[]): void;
}
export declare function setLogger(newLogger: CodyLogger): void;
export declare function logDebug(filterLabel: string, text: string, ...args: unknown[]): void;
export declare function logError(filterLabel: string, text: string, ...args: unknown[]): void;
//# sourceMappingURL=logger.d.ts.map