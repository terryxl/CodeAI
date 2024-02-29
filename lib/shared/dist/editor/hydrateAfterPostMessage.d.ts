/**
 * Recursively re-hydrate {@link value}, re-creating instances of classes from the raw data that was
 * sent to us via `postMessage`. When values are sent over `postMessage` between the webview and the
 * extension host, only data is preserved, not classes/prototypes. This is a problem particularly
 * with URI instances.
 *
 * This function mutates `value`.
 */
export declare function hydrateAfterPostMessage<T, U>(value: T, hydrateUri: (value: unknown) => U): T;
//# sourceMappingURL=hydrateAfterPostMessage.d.ts.map