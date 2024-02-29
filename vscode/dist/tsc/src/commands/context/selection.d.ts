import { type ContextFile } from '@sourcegraph/cody-shared';
/**
 * Gets context file content from the current editor selection.
 *
 * When no selection is made, try getting the smart selection based on the cursor position.
 * If no smart selection is found, use the visible range of the editor instead.
 */
export declare function getContextFileFromCursor(): Promise<ContextFile[]>;
//# sourceMappingURL=selection.d.ts.map