/// <reference path="../../../../../src/fileUri.d.ts" />
import type { Position } from 'vscode';
export declare const OPENING_CODE_TAG = "<CODE5711>";
export declare const CLOSING_CODE_TAG = "</CODE5711>";
export declare const MULTILINE_STOP_SEQUENCE = "\n\n";
/**
 * This extracts the generated code from the response from Anthropic. The generated code is book
 * ended by <CODE5711></CODE5711> tags (the '5711' ensures the tags are not interpreted as HTML tags
 * and this seems to yield better results).
 *
 * Any trailing whitespace is trimmed, but leading whitespace is preserved. Trailing whitespace
 * seems irrelevant to the user experience. Leading whitespace is important, as leading newlines and
 * indentation are relevant.
 * @param completion The raw completion result received from Anthropic
 * @returns the extracted code block
 */
export declare function extractFromCodeBlock(completion: string): string;
export declare function fixBadCompletionStart(completion: string): string;
/**
 * A TrimmedString represents a string that has had its lead and rear whitespace trimmed.
 * This to manage and track whitespace during pre- and post-processing of inputs to
 * the Claude API, which is highly sensitive to whitespace and performs better when there
 * is no trailing whitespace in its input.
 */
interface TrimmedString {
    trimmed: string;
    leadSpace: string;
    rearSpace: string;
    raw?: string;
}
/**
 * PrefixComponents represent the different components of the "prefix", the section of the
 * current file preceding the cursor. The prompting strategy for Claude follows this pattern:
 *
 * Human: Complete this code: <CODE5711>const foo = 'bar'
 * const bar = 'blah'</CODE5711>
 *
 * Assistant: Here is the completion: <CODE5711>const baz = 'buzz'
 * return</CODE5711>
 *
 * Note that we "put words into Claude's mouth" to ensure the completion starts from the
 * appropriate point in code.
 *
 * tail needs to be long enough to be coherent, but no longer than necessary, because Claude
 * prefers shorter Assistant responses, so if the tail is too long, the returned completion
 * will be very short or empty. In practice, a good length for tail is 1-2 lines.
 */
export interface PrefixComponents {
    head: TrimmedString;
    tail: TrimmedString;
    overlap?: string;
}
export declare function getHeadAndTail(s: string): PrefixComponents;
export declare function trimUntilSuffix(insertion: string, prefix: string, suffix: string, languageId: string): string;
/**
 * Trims whitespace before the first newline (if it exists).
 */
export declare function trimLeadingWhitespaceUntilNewline(str: string): string;
/**
 * Collapses whitespace that appears at the end of prefix and the start of completion.
 *
 * For example, if prefix is `const isLocalhost = window.location.host ` and completion is ` ===
 * 'localhost'`, it trims the leading space in the completion to avoid a duplicate space.
 *
 * Language-specific customizations are needed here to get greater accuracy.
 */
export declare function collapseDuplicativeWhitespace(prefix: string, completion: string): string;
export declare function removeTrailingWhitespace(text: string): string;
export declare const OPENING_BRACKET_REGEX: RegExp;
export declare const FUNCTION_OR_METHOD_INVOCATION_REGEX: RegExp;
export declare const FUNCTION_KEYWORDS: RegExp;
export declare const BRACKET_PAIR: {
    readonly '(': ")";
    readonly '[': "]";
    readonly '{': "}";
    readonly '<': ">";
};
export type OpeningBracket = keyof typeof BRACKET_PAIR;
export declare function getEditorTabSize(): number;
/**
 * Counts space or tabs in the beginning of a line.
 *
 * Since Cody can sometimes respond in a mix of tab and spaces, this function
 * normalizes the whitespace first using the currently enabled tabSize option.
 */
export declare function indentation(line: string): number;
/**
 * Only include a closing line (e.g. `}`) if the block is empty yet if the block is already closed.
 * We detect this by looking at the indentation of the next non-empty line.
 */
export declare function shouldIncludeClosingLine(prefixIndentationWithFirstCompletionLine: string, suffix: string): boolean;
export declare function getFirstLine(text: string): string;
export declare function getLastLine(text: string): string;
export declare function getNextNonEmptyLine(suffix: string): string;
export declare function getPrevNonEmptyLine(prefix: string): string;
export declare function lines(text: string): string[];
export declare function hasCompleteFirstLine(text: string): boolean;
export declare function lastNLines(text: string, n: number): string;
export declare function removeIndentation(text: string): string;
export declare function getPositionAfterTextInsertion(position: Position, text?: string): Position;
export declare function getSuffixAfterFirstNewline(suffix: string): string;
export {};
//# sourceMappingURL=utils.d.ts.map