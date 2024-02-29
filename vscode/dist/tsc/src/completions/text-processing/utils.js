"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSuffixAfterFirstNewline = exports.getPositionAfterTextInsertion = exports.removeIndentation = exports.lastNLines = exports.hasCompleteFirstLine = exports.lines = exports.getPrevNonEmptyLine = exports.getNextNonEmptyLine = exports.getLastLine = exports.getFirstLine = exports.shouldIncludeClosingLine = exports.indentation = exports.getEditorTabSize = exports.BRACKET_PAIR = exports.FUNCTION_KEYWORDS = exports.FUNCTION_OR_METHOD_INVOCATION_REGEX = exports.OPENING_BRACKET_REGEX = exports.removeTrailingWhitespace = exports.collapseDuplicativeWhitespace = exports.trimLeadingWhitespaceUntilNewline = exports.trimUntilSuffix = exports.getHeadAndTail = exports.fixBadCompletionStart = exports.extractFromCodeBlock = exports.MULTILINE_STOP_SEQUENCE = exports.CLOSING_CODE_TAG = exports.OPENING_CODE_TAG = void 0;
const lodash_1 = require("lodash");
const vscode = __importStar(require("vscode"));
const language_1 = require("../../tree-sitter/language");
const logger_1 = require("../logger");
const string_comparator_1 = require("./string-comparator");
exports.OPENING_CODE_TAG = '<CODE5711>';
exports.CLOSING_CODE_TAG = '</CODE5711>';
exports.MULTILINE_STOP_SEQUENCE = '\n\n';
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
function extractFromCodeBlock(completion) {
    if (completion.includes(exports.OPENING_CODE_TAG)) {
        (0, logger_1.logCompletionBookkeepingEvent)('containsOpeningTag');
        return '';
    }
    const index = completion.indexOf(exports.CLOSING_CODE_TAG);
    if (index === -1) {
        return completion;
    }
    return completion.slice(0, index);
}
exports.extractFromCodeBlock = extractFromCodeBlock;
const BAD_COMPLETION_START = /^(\p{Emoji_Presentation}|\u{200B}|\+ |- |\. )+(\s)+/u;
function fixBadCompletionStart(completion) {
    if (BAD_COMPLETION_START.test(completion)) {
        return completion.replace(BAD_COMPLETION_START, '');
    }
    return completion;
}
exports.fixBadCompletionStart = fixBadCompletionStart;
// Split string into head and tail. The tail is at most the last 2 non-empty lines of the snippet
function getHeadAndTail(s) {
    const lines = s.split('\n');
    const tailThreshold = 2;
    let nonEmptyCount = 0;
    let tailStart = -1;
    for (let i = lines.length - 1; i >= 0; i--) {
        if (lines[i].trim().length > 0) {
            nonEmptyCount++;
        }
        if (nonEmptyCount >= tailThreshold) {
            tailStart = i;
            break;
        }
    }
    let headAndTail;
    if (tailStart === -1) {
        headAndTail = { head: trimSpace(s), tail: trimSpace(s), overlap: s };
    }
    else {
        headAndTail = {
            head: trimSpace(`${lines.slice(0, tailStart).join('\n')}\n`),
            tail: trimSpace(lines.slice(tailStart).join('\n')),
        };
    }
    // We learned that Anthropic is giving us worse results with trailing whitespace in the prompt.
    // To fix this, we started to trim the prompt.
    //
    // However, when the prefix includes a line break, the LLM needs to know that we do not want the
    // current line to complete and instead start a new one. For this specific case, we're injecting
    // a line break in the trimmed prefix.
    //
    // This will only be added if the existing line is otherwise empty and will help especially with
    // cases like users typing a comment and asking the LLM to provide a suggestion for the next
    // line of code:
    //
    //     // Write some code
    //     █
    //
    if (headAndTail.tail.rearSpace.includes('\n')) {
        headAndTail.tail.trimmed += '\n';
    }
    return headAndTail;
}
exports.getHeadAndTail = getHeadAndTail;
function trimSpace(s) {
    const trimmed = s.trim();
    const headEnd = s.indexOf(trimmed);
    return {
        raw: s,
        trimmed,
        leadSpace: s.slice(0, headEnd),
        rearSpace: s.slice(headEnd + trimmed.length),
    };
}
/*
 * Trims the insertion string until the first line that matches the suffix string.
 *
 * This is to "fit" the completion from Claude back into the code we're modifying.
 * Oftentimes, the last couple of lines of the completion may match against the suffix
 * (the code following the cursor).
 */
function trimUntilSuffix(insertion, prefix, suffix, languageId) {
    const config = (0, language_1.getLanguageConfig)(languageId);
    insertion = insertion.trimEnd();
    const firstNonEmptySuffixLine = getFirstNonEmptyLine(suffix);
    // TODO: Handle case for inline suffix - remove same trailing sequence from insertion
    // if we already have the same sequence in suffix
    if (firstNonEmptySuffixLine.length === 0) {
        return insertion;
    }
    const prefixLastNewLine = prefix.lastIndexOf('\n');
    const prefixIndentationWithFirstCompletionLine = prefix.slice(prefixLastNewLine + 1);
    const suffixIndent = indentation(firstNonEmptySuffixLine);
    const startIndent = indentation(prefixIndentationWithFirstCompletionLine);
    const hasEmptyCompletionLine = prefixIndentationWithFirstCompletionLine.trim() === '';
    const insertionLines = insertion.split('\n');
    let cutOffIndex = insertionLines.length;
    for (let i = insertionLines.length - 1; i >= 0; i--) {
        let line = insertionLines[i];
        if (line.length === 0) {
            continue;
        }
        // Include the current indentation of the prefix in the first line
        if (i === 0) {
            line = prefixIndentationWithFirstCompletionLine + line;
        }
        const lineIndentation = indentation(line);
        const isSameIndentation = lineIndentation <= suffixIndent;
        if (hasEmptyCompletionLine &&
            config?.blockEnd &&
            line.trim().startsWith(config.blockEnd) &&
            startIndent === lineIndentation &&
            insertionLines.length === 1) {
            cutOffIndex = i;
            break;
        }
        if (isSameIndentation &&
            ((0, string_comparator_1.isAlmostTheSameString)(line, firstNonEmptySuffixLine) ||
                firstNonEmptySuffixLine.startsWith(line))) {
            cutOffIndex = i;
            break;
        }
    }
    return insertionLines.slice(0, cutOffIndex).join('\n');
}
exports.trimUntilSuffix = trimUntilSuffix;
function getFirstNonEmptyLine(suffix) {
    const nextLineSuffix = suffix.slice(suffix.indexOf('\n'));
    for (const line of nextLineSuffix.split('\n')) {
        if (line.trim().length > 0) {
            return line;
        }
    }
    return '';
}
/**
 * Trims whitespace before the first newline (if it exists).
 */
function trimLeadingWhitespaceUntilNewline(str) {
    return str.replace(/^\s+?(\r?\n)/, '$1');
}
exports.trimLeadingWhitespaceUntilNewline = trimLeadingWhitespaceUntilNewline;
/**
 * Collapses whitespace that appears at the end of prefix and the start of completion.
 *
 * For example, if prefix is `const isLocalhost = window.location.host ` and completion is ` ===
 * 'localhost'`, it trims the leading space in the completion to avoid a duplicate space.
 *
 * Language-specific customizations are needed here to get greater accuracy.
 */
function collapseDuplicativeWhitespace(prefix, completion) {
    if (prefix.endsWith(' ') || prefix.endsWith('\t')) {
        completion = completion.replace(/^[\t ]+/, '');
    }
    return completion;
}
exports.collapseDuplicativeWhitespace = collapseDuplicativeWhitespace;
function removeTrailingWhitespace(text) {
    return text
        .split('\n')
        .map(l => l.trimEnd())
        .join('\n');
}
exports.removeTrailingWhitespace = removeTrailingWhitespace;
const INDENTATION_REGEX = /^[\t ]*/;
exports.OPENING_BRACKET_REGEX = /([([{])$/;
exports.FUNCTION_OR_METHOD_INVOCATION_REGEX = /\b[^()]+\((.*)\)$/g;
exports.FUNCTION_KEYWORDS = /^(function|def|fn)/g;
exports.BRACKET_PAIR = {
    '(': ')',
    '[': ']',
    '{': '}',
    '<': '>',
};
function getEditorTabSize() {
    return vscode.window.activeTextEditor
        ? vscode.window.activeTextEditor.options.tabSize
        : 2;
}
exports.getEditorTabSize = getEditorTabSize;
/**
 * Counts space or tabs in the beginning of a line.
 *
 * Since Cody can sometimes respond in a mix of tab and spaces, this function
 * normalizes the whitespace first using the currently enabled tabSize option.
 */
function indentation(line) {
    const tabSize = getEditorTabSize();
    const regex = line.match(INDENTATION_REGEX);
    if (regex) {
        const whitespace = regex[0];
        return [...whitespace].reduce((p, c) => p + (c === '\t' ? tabSize : 1), 0);
    }
    return 0;
}
exports.indentation = indentation;
/**
 * If a completion starts with an opening bracket and a suffix starts with
 * the corresponding closing bracket, we include the last closing bracket of the completion.
 * E.g., function foo(__CURSOR__)
 *
 * We can do this because we know that the existing block is already closed, which means that
 * new blocks need to be closed separately.
 * E.g. function foo() { console.log('hello') }
 */
function shouldIncludeClosingLineBasedOnBrackets(prefixIndentationWithFirstCompletionLine, suffix) {
    const matches = prefixIndentationWithFirstCompletionLine.match(exports.OPENING_BRACKET_REGEX);
    if (matches && matches.length > 0) {
        const openingBracket = matches[0];
        const closingBracket = exports.BRACKET_PAIR[openingBracket];
        return Boolean(openingBracket) && suffix.startsWith(closingBracket);
    }
    return false;
}
/**
 * Only include a closing line (e.g. `}`) if the block is empty yet if the block is already closed.
 * We detect this by looking at the indentation of the next non-empty line.
 */
function shouldIncludeClosingLine(prefixIndentationWithFirstCompletionLine, suffix) {
    const includeClosingLineBasedOnBrackets = shouldIncludeClosingLineBasedOnBrackets(prefixIndentationWithFirstCompletionLine, suffix);
    const startIndent = indentation(prefixIndentationWithFirstCompletionLine);
    const nextNonEmptyLine = getNextNonEmptyLine(suffix);
    return indentation(nextNonEmptyLine) < startIndent || includeClosingLineBasedOnBrackets;
}
exports.shouldIncludeClosingLine = shouldIncludeClosingLine;
function getFirstLine(text) {
    const firstLf = text.indexOf('\n');
    const firstCrLf = text.indexOf('\r\n');
    // There are no line breaks
    if (firstLf === -1 && firstCrLf === -1) {
        return text;
    }
    return text.slice(0, firstCrLf >= 0 ? firstCrLf : firstLf);
}
exports.getFirstLine = getFirstLine;
function getLastLine(text) {
    const lastLf = text.lastIndexOf('\n');
    const lastCrLf = text.lastIndexOf('\r\n');
    // There are no line breaks
    if (lastLf === -1 && lastCrLf === -1) {
        return text;
    }
    return text.slice(lastCrLf >= 0 ? lastCrLf + 2 : lastLf + 1);
}
exports.getLastLine = getLastLine;
function getNextNonEmptyLine(suffix) {
    const nextLf = suffix.indexOf('\n');
    const nextCrLf = suffix.indexOf('\r\n');
    // There is no next line
    if (nextLf === -1 && nextCrLf === -1) {
        return '';
    }
    return (lines(suffix.slice(nextCrLf >= 0 ? nextCrLf + 2 : nextLf + 1)).find(line => line.trim().length > 0) ?? '');
}
exports.getNextNonEmptyLine = getNextNonEmptyLine;
function getPrevNonEmptyLine(prefix) {
    const prevLf = prefix.lastIndexOf('\n');
    const prevCrLf = prefix.lastIndexOf('\r\n');
    // There is no prev line
    if (prevLf === -1 && prevCrLf === -1) {
        return '';
    }
    return ((0, lodash_1.findLast)(lines(prefix.slice(0, prevCrLf >= 0 ? prevCrLf : prevLf)), line => line.trim().length > 0) ?? '');
}
exports.getPrevNonEmptyLine = getPrevNonEmptyLine;
function lines(text) {
    return text.split(/\r?\n/);
}
exports.lines = lines;
function hasCompleteFirstLine(text) {
    const lastNewlineIndex = text.indexOf('\n');
    return lastNewlineIndex !== -1;
}
exports.hasCompleteFirstLine = hasCompleteFirstLine;
function lastNLines(text, n) {
    const lines = text.split('\n');
    return lines.slice(Math.max(0, lines.length - n)).join('\n');
}
exports.lastNLines = lastNLines;
function removeIndentation(text) {
    const lines = text.split('\n');
    return lines.map(line => line.replace(INDENTATION_REGEX, '')).join('\n');
}
exports.removeIndentation = removeIndentation;
function getPositionAfterTextInsertion(position, text) {
    if (!text || text.length === 0) {
        return position;
    }
    const insertedLines = lines(text);
    const updatedPosition = insertedLines.length <= 1
        ? position.translate(0, Math.max(getFirstLine(text).length, 0))
        : new vscode.Position(position.line + insertedLines.length - 1, insertedLines.at(-1).length);
    return updatedPosition;
}
exports.getPositionAfterTextInsertion = getPositionAfterTextInsertion;
function getSuffixAfterFirstNewline(suffix) {
    const firstNlInSuffix = suffix.indexOf('\n');
    // When there is no next line, the suffix should be empty
    if (firstNlInSuffix === -1) {
        return '';
    }
    return suffix.slice(firstNlInSuffix);
}
exports.getSuffixAfterFirstNewline = getSuffixAfterFirstNewline;
