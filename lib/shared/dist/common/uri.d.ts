import type { URI } from 'vscode-uri';
/**
 * dirname, but operates on a {@link URI}.
 *
 * Use this instead of Node's `path` module because on Windows, Node `path` uses '\' as path
 * separators, which will break because URI paths are always separated with '/'.
 */
export declare function uriDirname(uri: URI): URI;
/**
 * basename, but operates on a {@link URI}'s path.
 *
 * See {@link uriDirname} for why we use this instead of Node's `path` module.
 */
export declare function uriBasename(uri: URI, suffix?: string): string;
/**
 * extname, but operates on a {@link URI}'s path.
 *
 * See {@link uriDirname} for why we use this instead of Node's `path` module.
 */
export declare function uriExtname(uri: URI): string;
/**
 * parse, but operates on a {@link URI}'s path.
 *
 * See {@link uriDirname} for why we use this instead of Node's `path` module.
 */
export declare function uriParseNameAndExtension(uri: URI): {
    name: string;
    ext: string;
};
/**
 * A file URI.
 *
 * It is helpful to use the {@link FileURI} type instead of just {@link URI} or {@link vscode.Uri}
 * when the URI is known to be `file`-scheme-only.
 */
export type FileURI = Omit<URI, 'fsPath'> & {
    scheme: 'file';
    /**
     * The platform-specific file system path. Thank you for only using `.fsPath` on {@link FileURI}
     * types (and not vscode.Uri or URI types)! :-)
     */
    fsPath: string;
};
export declare function isFileURI(uri: URI): uri is FileURI;
export declare function assertFileURI(uri: URI): FileURI;
declare module 'vscode-uri' {
    class URI {
        static file(fsPath: string): FileURI;
        /**
         * @deprecated Only call `.fsPath` on {@link FileURI}, which you can create with `URI.file`
         * or with the {@link isFileURI} and {@link assertFileURI} helpers.
         */
        fsPath: string;
    }
}
//# sourceMappingURL=uri.d.ts.map