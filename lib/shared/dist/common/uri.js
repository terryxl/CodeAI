import { pathFunctionsForURI } from './path';
/**
 * dirname, but operates on a {@link URI}.
 *
 * Use this instead of Node's `path` module because on Windows, Node `path` uses '\' as path
 * separators, which will break because URI paths are always separated with '/'.
 */
export function uriDirname(uri) {
    return uri.with({ path: pathFunctionsForURI(uri).dirname(uri.path) });
}
/**
 * basename, but operates on a {@link URI}'s path.
 *
 * See {@link uriDirname} for why we use this instead of Node's `path` module.
 */
export function uriBasename(uri, suffix) {
    return pathFunctionsForURI(uri).basename(uri.path, suffix);
}
/**
 * extname, but operates on a {@link URI}'s path.
 *
 * See {@link uriDirname} for why we use this instead of Node's `path` module.
 */
export function uriExtname(uri) {
    return pathFunctionsForURI(uri).extname(uri.path);
}
/**
 * parse, but operates on a {@link URI}'s path.
 *
 * See {@link uriDirname} for why we use this instead of Node's `path` module.
 */
export function uriParseNameAndExtension(uri) {
    const ext = uriExtname(uri);
    const name = uriBasename(uri, ext);
    return { ext, name };
}
export function isFileURI(uri) {
    return uri.scheme === 'file';
}
export function assertFileURI(uri) {
    if (!isFileURI(uri)) {
        throw new TypeError(`assertFileURI failed on ${uri.toString()}`);
    }
    return uri;
}
//# sourceMappingURL=uri.js.map