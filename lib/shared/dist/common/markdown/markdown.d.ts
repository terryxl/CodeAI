import { type Config as DOMPurifyConfig } from 'dompurify';
import { marked } from 'marked';
export interface MarkdownOptions {
    /** Whether to render line breaks as HTML `<br>`s */
    breaks?: boolean;
    /** Whether to disable autolinks. Explicit links using `[text](url)` are still allowed. */
    disableAutolinks?: boolean;
    renderer?: marked.Renderer;
    headerPrefix?: string;
    /** Strip off any HTML and return a plain text string, useful for previews */
    plainText?: boolean;
    dompurifyConfig?: DOMPurifyConfig & {
        RETURN_DOM_FRAGMENT?: false;
        RETURN_DOM?: false;
    };
    noDomPurify?: boolean;
    /**
     * Add target="_blank" and rel="noopener" to all <a> links that have a
     * href value. This affects all markdown-formatted links and all inline
     * HTML links.
     */
    addTargetBlankToAllLinks?: boolean;
    /**
     * Wrap all <a> links that have a href value with the _cody.vscode.open
     * command that will open the links with the editor link handler.
     */
    wrapLinksWithCodyCommand?: boolean;
}
/**
 * Renders the given markdown to HTML, highlighting code and sanitizing dangerous HTML.
 * Can throw an exception on parse errors.
 * @param markdown The markdown to render
 */
export declare const renderMarkdown: (markdown: string, options?: MarkdownOptions) => string;
//# sourceMappingURL=markdown.d.ts.map