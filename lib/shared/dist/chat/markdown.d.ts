import { type MarkdownOptions } from '../common/markdown';
/**
 * Render Markdown to safe HTML.
 *
 * NOTE: This only works when called in an environment with the DOM. In the VS
 * Code extension, it only works in the webview context, not in the extension
 * host context, because the latter lacks a DOM. We could use
 * isomorphic-dompurify for that, but that adds needless complexity for now. If
 * that becomes necessary, we can add that.
 */
export declare function renderCodyMarkdown(markdown: string, options?: MarkdownOptions): string;
//# sourceMappingURL=markdown.d.ts.map