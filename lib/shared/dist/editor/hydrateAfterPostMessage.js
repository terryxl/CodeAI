/**
 * Recursively re-hydrate {@link value}, re-creating instances of classes from the raw data that was
 * sent to us via `postMessage`. When values are sent over `postMessage` between the webview and the
 * extension host, only data is preserved, not classes/prototypes. This is a problem particularly
 * with URI instances.
 *
 * This function mutates `value`.
 */
export function hydrateAfterPostMessage(value, hydrateUri) {
    if (isDehydratedUri(value)) {
        return hydrateUri(value);
    }
    if (Array.isArray(value)) {
        return value.map(e => hydrateAfterPostMessage(e, hydrateUri));
    }
    if (value instanceof Object) {
        // Hydrate any values that are classes.
        for (const key of Object.keys(value)) {
            ;
            value[key] = hydrateAfterPostMessage(value[key], hydrateUri);
        }
        return value;
    }
    return value;
}
function isDehydratedUri(value) {
    return (Boolean(value) &&
        // vscode.Uri
        ((value.$mid !== undefined &&
            value.path !== undefined &&
            value.scheme !== undefined) ||
            // vscode-uri.URI
            (value.authority !== undefined &&
                value.path !== undefined &&
                value.fragment !== undefined &&
                value.query !== undefined)));
}
//# sourceMappingURL=hydrateAfterPostMessage.js.map