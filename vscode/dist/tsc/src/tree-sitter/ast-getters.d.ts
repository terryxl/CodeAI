import type { Point, SyntaxNode } from 'web-tree-sitter';
/**
 * Returns a descendant node at the start position and three parent nodes.
 */
export declare function getNodeAtCursorAndParents(node: SyntaxNode, startPosition: Point): readonly [
    {
        readonly name: 'at_cursor';
        readonly node: SyntaxNode;
    },
    ...{
        name: string;
        node: SyntaxNode;
    }[]
];
//# sourceMappingURL=ast-getters.d.ts.map