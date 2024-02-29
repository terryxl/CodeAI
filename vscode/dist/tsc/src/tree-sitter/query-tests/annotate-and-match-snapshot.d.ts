import type { default as Parser, Point, SyntaxNode } from 'web-tree-sitter';
import type { SupportedLanguage } from '../grammars';
type Captures = (node: SyntaxNode, startPosition: Point, endPosition?: Point) => readonly Readonly<Parser.QueryCapture>[];
interface AnnotateAndMatchParams {
    sourcesPath: string;
    parser: Parser;
    language: SupportedLanguage;
    captures: Captures;
}
/**
 * Add "// only", or other comment delimiter for the current language, to
 * focus on one code sample (similar to `it.only` from `jest`).
 */
export declare function annotateAndMatchSnapshot(params: AnnotateAndMatchParams): Promise<void>;
export {};
//# sourceMappingURL=annotate-and-match-snapshot.d.ts.map