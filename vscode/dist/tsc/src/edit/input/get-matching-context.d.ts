import type { ContextFile } from '@sourcegraph/cody-shared';
interface FixupMatchingContext {
    key: string;
    shortLabel?: string;
    file: ContextFile;
}
export declare function getMatchingContext(instruction: string): Promise<FixupMatchingContext[] | null>;
export {};
//# sourceMappingURL=get-matching-context.d.ts.map