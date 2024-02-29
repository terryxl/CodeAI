/**
 * Open file in editor (assumed filePath is absolute) and optionally reveal a specific range
 */
export declare function openLocalFileWithRange(filePath: string, range?: CodeRange): Promise<void>;
/**
 * Open external links
 */
export declare function openExternalLinks(uri: string): Promise<void>;
interface CodeRange {
    start: {
        line: number;
        character: number;
    };
    end: {
        line: number;
        character: number;
    };
}
export {};
//# sourceMappingURL=workspace-action.d.ts.map