export declare function dumpUse(use: Uint8Array, a: string, b: string): void;
export declare function longestCommonSubsequence(a: string, b: string): Uint8Array;
export interface Position {
    line: number;
    character: number;
}
export interface Range {
    start: Position;
    end: Position;
}
export interface Edit {
    text: string;
    range: Range;
}
export interface Diff {
    originalText: string;
    bufferText: string;
    mergedText: string | undefined;
    clean: boolean;
    conflicts: Range[];
    edits: Edit[];
    highlights: Range[];
}
export declare function computeDiff(original: string, a: string, b: string, bStart: Position): Diff;
//# sourceMappingURL=diff.d.ts.map