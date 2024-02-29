"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNodeAtCursorAndParents = void 0;
const cody_shared_1 = require("@sourcegraph/cody-shared");
/**
 * Returns a descendant node at the start position and three parent nodes.
 */
function getNodeAtCursorAndParents(node, startPosition) {
    const atCursorNode = node.descendantForPosition(startPosition);
    const parent = atCursorNode.parent;
    const parents = [parent, parent?.parent, parent?.parent?.parent].filter(cody_shared_1.isDefined).map(node => ({
        name: 'parents',
        node,
    }));
    return [
        {
            name: 'at_cursor',
            node: atCursorNode,
        },
        ...parents,
    ];
}
exports.getNodeAtCursorAndParents = getNodeAtCursorAndParents;
