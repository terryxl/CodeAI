import type { URI } from 'vscode-uri';
export interface PathFunctions {
    /**
     * All but the last element of path, or "." if that would be the empty path.
     */
    dirname: (path: string) => string;
    /**
     * The last element of path, or "" if path is empty.
     * @param path the path to operate on
     * @param suffix optional suffix to remove
     */
    basename: (path: string, suffix?: string) => string;
    /** The extension of path, including the last '.'. */
    extname: (path: string) => string;
    /**
     * The relative path from {@link from} to {@link to}.
     */
    relative: (from: string, to: string) => string;
    /** Path separator. */
    separator: PathSeparator;
}
/** For file system paths on Windows ('\' separators, drive letters, case-insensitive). */
export declare const windowsFilePaths: PathFunctions;
/** For POSIX file system paths ('/' separators, case-sensitive). */
export declare const posixFilePaths: PathFunctions;
/**
 * Get the {@link PathFunctions} to use for the given URI's path ('/' separators, drive letters/case-sensitivity depend on `isWindows`).
 */
export declare function pathFunctionsForURI(uri: URI, isWindows?: boolean): PathFunctions;
type PathSeparator = '\\' | '/';
export {};
//# sourceMappingURL=path.d.ts.map