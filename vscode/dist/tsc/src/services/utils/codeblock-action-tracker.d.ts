import type { CodeBlockMeta } from '@sourcegraph/cody-ui/src/chat/CodeBlocks';
/**
 * Handles insert event to insert text from code block at cursor position
 * Replace selection if there is one and then log insert event
 * Note: Using workspaceEdit instead of 'editor.action.insertSnippet' as the later reformats the text incorrectly
 */
export declare function handleCodeFromInsertAtCursor(text: string, meta?: CodeBlockMeta): Promise<void>;
/**
 * Handles insert event to insert text from code block to new file
 */
export declare function handleCodeFromSaveToNewFile(text: string, meta?: CodeBlockMeta): void;
/**
 * Handles copying code and detecting a paste event.
 */
export declare function handleCopiedCode(text: string, isButtonClickEvent: boolean, meta?: CodeBlockMeta): Promise<void>;
export declare function onTextDocumentChange(newCode: string): Promise<void>;
//# sourceMappingURL=codeblock-action-tracker.d.ts.map