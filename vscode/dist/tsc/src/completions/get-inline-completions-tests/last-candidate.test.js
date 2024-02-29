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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dedent_1 = __importDefault(require("dedent"));
const vitest_1 = require("vitest");
const vscode = __importStar(require("vscode"));
const textDocument_1 = require("../../testutils/textDocument");
const get_current_doc_context_1 = require("../get-current-doc-context");
const get_inline_completions_1 = require("../get-inline-completions");
const test_helpers_1 = require("../test-helpers");
const helpers_1 = require("./helpers");
(0, vitest_1.describe)('[getInlineCompletions] reuseLastCandidate', () => {
    function lastCandidate(code, insertText, lastTriggerSelectedCompletionInfo, range) {
        const { document, position } = (0, test_helpers_1.documentAndPosition)(code);
        const lastDocContext = (0, get_current_doc_context_1.getCurrentDocContext)({
            document,
            position,
            maxPrefixLength: 100,
            maxSuffixLength: 100,
            dynamicMultilineCompletions: false,
            context: lastTriggerSelectedCompletionInfo
                ? {
                    triggerKind: vscode.InlineCompletionTriggerKind.Automatic,
                    selectedCompletionInfo: lastTriggerSelectedCompletionInfo,
                }
                : undefined,
        });
        return {
            uri: document.uri,
            lastTriggerPosition: position,
            lastTriggerSelectedCompletionInfo,
            result: {
                logId: '1',
                source: get_inline_completions_1.InlineCompletionsResultSource.Network,
                items: Array.isArray(insertText)
                    ? insertText.map(insertText => ({ insertText }))
                    : [{ insertText, range }],
            },
            lastTriggerDocContext: lastDocContext,
        };
    }
    (0, vitest_1.it)('is reused when typing forward as suggested', async () => 
    // The user types `\n`, sees ghost text `const x = 123`, then types `const x = 1` (i.e.,
    // all but the last 2 characters of the ghost text). The original completion should
    // still display.
    (0, vitest_1.expect)(await (0, helpers_1.getInlineCompletions)((0, helpers_1.params)('\nconst x = 1█', [], { lastCandidate: lastCandidate('\n█', 'const x = 123') }))).toEqual({
        items: [{ insertText: '23' }],
        source: get_inline_completions_1.InlineCompletionsResultSource.LastCandidate,
    }));
    (0, vitest_1.it)('updates the insertion range when typing forward as suggested', async () => (0, vitest_1.expect)(await (0, helpers_1.getInlineCompletions)((0, helpers_1.params)('\nconst x = 1█;', [], {
        lastCandidate: lastCandidate('\nconst x = █;', '123', undefined, (0, textDocument_1.range)(1, 10, 1, 10)),
    }))).toEqual({
        items: [{ insertText: '23', range: (0, textDocument_1.range)(1, 11, 1, 11) }],
        source: get_inline_completions_1.InlineCompletionsResultSource.LastCandidate,
    }));
    (0, vitest_1.it)('is reused when typing forward as suggested through partial whitespace', async () => 
    // The user types ` `, sees ghost text ` x`, then types ` `. The original completion
    // should still display.
    (0, vitest_1.expect)(await (0, helpers_1.getInlineCompletions)((0, helpers_1.params)('  █', [], { lastCandidate: lastCandidate(' █', ' x') }))).toEqual({
        items: [{ insertText: 'x' }],
        source: get_inline_completions_1.InlineCompletionsResultSource.LastCandidate,
    }));
    (0, vitest_1.it)('is reused when typing forward as suggested through all whitespace', async () => 
    // The user sees ghost text `  x`, then types `  `. The original completion should still
    // display.
    (0, vitest_1.expect)(await (0, helpers_1.getInlineCompletions)((0, helpers_1.params)('  █', [], { lastCandidate: lastCandidate('█', '  x') }))).toEqual({
        items: [{ insertText: 'x' }],
        source: get_inline_completions_1.InlineCompletionsResultSource.LastCandidate,
    }));
    (0, vitest_1.it)('is reused when the deleting back to the start of the original trigger (but no further)', async () => 
    // The user types `const x`, accepts a completion to `const x = 123`, then deletes back
    // to `const x` (i.e., to the start of the original trigger). The original completion
    // should be reused.
    (0, vitest_1.expect)(await (0, helpers_1.getInlineCompletions)((0, helpers_1.params)('const x█', [], { lastCandidate: lastCandidate('const x█', ' = 123') }))).toEqual({
        items: [{ insertText: ' = 123' }],
        source: get_inline_completions_1.InlineCompletionsResultSource.LastCandidate,
    }));
    (0, vitest_1.it)('is not reused when deleting past the entire original trigger', async () => 
    // The user types `const x`, accepts a completion to `const x = 1`, then deletes back to
    // `const ` (i.e., *past* the start of the original trigger). The original ghost text
    // should not be reused.
    (0, vitest_1.expect)(await (0, helpers_1.getInlineCompletions)((0, helpers_1.params)('const █', [], {
        lastCandidate: lastCandidate('const x█', ' = 1'),
    }))).toEqual({
        items: [],
        source: get_inline_completions_1.InlineCompletionsResultSource.Network,
    }));
    (0, vitest_1.it)('is not reused when the the next non-empty line has changed', async () => {
        // The user accepts a completion and then moves the cursor to the previous line and hits
        // enter again, causing a full suffix match with the previous completion that was
        // accepted before.
        const completions = await (0, helpers_1.getInlineCompletions)((0, helpers_1.params)((0, dedent_1.default) `
                    function foo() {
                        █
                        console.log()
                    }
                `, [], {
            lastCandidate: lastCandidate((0, dedent_1.default) `
                        function foo() {
                            █
                        }
                    `, 'console.log()'),
        }));
        (0, vitest_1.expect)(completions).toEqual({
            items: [],
            source: get_inline_completions_1.InlineCompletionsResultSource.Network,
        });
    });
    (0, vitest_1.it)('is not reused when deleting the entire non-whitespace line', async () => 
    // The user types `const x`, then deletes the entire line. The original ghost text
    // should not be reused.
    (0, vitest_1.expect)(await (0, helpers_1.getInlineCompletions)((0, helpers_1.params)('█', [], {
        lastCandidate: lastCandidate('const x█', ' = 1'),
    }))).toEqual({
        items: [],
        source: get_inline_completions_1.InlineCompletionsResultSource.Network,
    }));
    (0, vitest_1.it)('is not reused when prefix changes', async () => 
    // The user types `x`, then deletes it, then types `y`. The original ghost text should
    // not be reused.
    (0, vitest_1.expect)(await (0, helpers_1.getInlineCompletions)((0, helpers_1.params)('y█', [], {
        lastCandidate: lastCandidate('x█', ' = 1'),
    }))).toEqual({
        items: [],
        source: get_inline_completions_1.InlineCompletionsResultSource.Network,
    }));
    (0, vitest_1.it)('is not reused and marked as accepted when the last character of a completion was typed', async () => {
        const handleDidAcceptCompletionItem = vitest_1.vitest.fn();
        // The user types the last character of a completion
        (0, vitest_1.expect)(await (0, helpers_1.getInlineCompletions)((0, helpers_1.params)('const x = 1337█', [], {
            lastCandidate: lastCandidate('const x = █', '1337'),
            handleDidAcceptCompletionItem,
        }))).toEqual({
            items: [],
            source: get_inline_completions_1.InlineCompletionsResultSource.Network,
        });
        (0, vitest_1.expect)(handleDidAcceptCompletionItem).toHaveBeenCalled();
    });
    (0, vitest_1.it)('filters to only matching last-candidate items', async () => 
    // This behavior and test case is actually not needed for VS Code because it automatically
    // filters out items whose `insertText` does not prefix-match the replace range. (See
    // vscode.InlineCompletionItem.filterText for the docs about this.) But it is good to
    // perform this filtering anyway to avoid dependence on little-known VS Code behavior that
    // other consumers of this (via the agent) will likely not implement.
    (0, vitest_1.expect)(await (0, helpers_1.getInlineCompletions)((0, helpers_1.params)('\nconsole.log("h█', [], {
        lastCandidate: lastCandidate('\n█', [
            'console.log("Hi abc")',
            'console.log("hi xyz")',
        ]),
    }))).toEqual({
        items: [{ insertText: 'i xyz")' }],
        source: get_inline_completions_1.InlineCompletionsResultSource.LastCandidate,
    }));
    (0, vitest_1.it)('is reused for a multi-line completion', async () => 
    // The user types ``, sees ghost text `x\ny`, then types ` ` (space). The original
    // completion should be reused.
    (0, vitest_1.expect)(await (0, helpers_1.getInlineCompletions)((0, helpers_1.params)('x█', [], { lastCandidate: lastCandidate('█', 'x\ny') }))).toEqual({
        items: [{ insertText: '\ny' }],
        source: get_inline_completions_1.InlineCompletionsResultSource.LastCandidate,
    }));
    (0, vitest_1.describe)('partial acceptance', () => {
        (0, vitest_1.it)('marks a completion as partially accepted when you type at least one word', async () => {
            const handleDidPartiallyAcceptCompletionItem = vitest_1.vitest.fn();
            const args = {
                lastCandidate: lastCandidate('█', 'console.log(1337)'),
                handleDidPartiallyAcceptCompletionItem,
            };
            // We did not complete the first word yet
            await (0, helpers_1.getInlineCompletions)((0, helpers_1.params)('consol█', [], args));
            (0, vitest_1.expect)(handleDidPartiallyAcceptCompletionItem).not.toHaveBeenCalled();
            // Now we did
            await (0, helpers_1.getInlineCompletions)((0, helpers_1.params)('console.█', [], args));
            (0, vitest_1.expect)(handleDidPartiallyAcceptCompletionItem).toHaveBeenCalledWith(vitest_1.expect.anything(), 8);
            // Subsequent keystrokes should continue updating the partial acceptance
            await (0, helpers_1.getInlineCompletions)((0, helpers_1.params)('console.log(█', [], args));
            (0, vitest_1.expect)(handleDidPartiallyAcceptCompletionItem).toHaveBeenCalledWith(vitest_1.expect.anything(), 12);
        });
    });
    (0, vitest_1.describe)('adding leading whitespace', () => {
        (0, vitest_1.it)('is reused when adding leading whitespace', async () => 
        // The user types ``, sees ghost text `x = 1`, then types ` ` (space). The original
        // completion should be reused.
        (0, vitest_1.expect)(await (0, helpers_1.getInlineCompletions)((0, helpers_1.params)(' █', [], { lastCandidate: lastCandidate('█', 'x = 1') }))).toEqual({
            items: [{ insertText: 'x = 1' }],
            source: get_inline_completions_1.InlineCompletionsResultSource.LastCandidate,
        }));
        (0, vitest_1.it)('is reused when adding more leading whitespace than present in the last candidate current line prefix', async () => {
            /*
             * The user types on a new line `\t`, the completion is generated in the background
             * `\t\tconst foo = 1`, while user adds `\t\t\t` to the current line.
             * As a result all `\t` should be removed from the completion as user typed them forward
             * as suggested. The resuling completion `const foo = 1`.
             */
            (0, vitest_1.expect)(await (0, helpers_1.getInlineCompletionsInsertText)((0, helpers_1.params)('\t\t\t\t█', [], {
                lastCandidate: lastCandidate('\t█', '\t\tconst x = 1'),
            }))).toEqual(['const x = 1']);
        });
        (0, vitest_1.it)('is reused when adding leading whitespace for a multi-line completion', async () => 
        // The user types ``, sees ghost text `x\ny`, then types ` `. The original completion
        // should be reused.
        (0, vitest_1.expect)(await (0, helpers_1.getInlineCompletions)((0, helpers_1.params)(' █', [], { lastCandidate: lastCandidate('█', 'x\ny') }))).toEqual({
            items: [{ insertText: 'x\ny' }],
            source: get_inline_completions_1.InlineCompletionsResultSource.LastCandidate,
        }));
    });
    (0, vitest_1.describe)('deleting leading whitespace', () => {
        const candidate = lastCandidate('\t\t█', 'const x = 1');
        (0, vitest_1.it)('is reused when deleting some (not all) leading whitespace', async () => 
        // The user types on a new line `\t\t`, sees ghost text `const x = 1`, then
        // deletes one `\t`. The same ghost text should still be displayed.
        (0, vitest_1.expect)(await (0, helpers_1.getInlineCompletions)((0, helpers_1.params)('\t█', [], { lastCandidate: candidate }))).toEqual({
            items: [{ insertText: 'const x = 1' }],
            source: get_inline_completions_1.InlineCompletionsResultSource.LastCandidate,
        }));
        (0, vitest_1.it)('is reused when deleting all leading whitespace', async () => 
        // The user types on a new line `\t\t`, sees ghost text `const x = 1`, then deletes
        // all leading whitespace (both `\t\t`). The same ghost text should still be
        // displayed.
        (0, vitest_1.expect)(await (0, helpers_1.getInlineCompletions)((0, helpers_1.params)('█', [], { lastCandidate: candidate }))).toEqual({
            items: [{ insertText: 'const x = 1' }],
            source: get_inline_completions_1.InlineCompletionsResultSource.LastCandidate,
        }));
        (0, vitest_1.it)('is not reused when different leading whitespace is added at end of prefix', async () => 
        // The user types on a new line `\t\t`, sees ghost text `const x = 1`, then deletes
        // `\t` and adds ` ` (space). The same ghost text should not still be displayed.
        (0, vitest_1.expect)(await (0, helpers_1.getInlineCompletions)((0, helpers_1.params)('\t █', [], { lastCandidate: candidate }))).toEqual({
            items: [],
            source: get_inline_completions_1.InlineCompletionsResultSource.Network,
        }));
        (0, vitest_1.it)('is not reused when different leading whitespace is added at start of prefix', async () => 
        // The user types on a new line `\t\t`, sees ghost text `const x = 1`, then deletes
        // `\t\t` and adds ` \t` (space). The same ghost text should not still be displayed.
        (0, vitest_1.expect)(await (0, helpers_1.getInlineCompletions)((0, helpers_1.params)(' \t█', [], { lastCandidate: candidate }))).toEqual({
            items: [],
            source: get_inline_completions_1.InlineCompletionsResultSource.Network,
        }));
        (0, vitest_1.it)('is not reused when prefix replaced by different leading whitespace', async () => 
        // The user types on a new line `\t\t`, sees ghost text `const x = 1`, then deletes
        // `\t\t` and adds ` ` (space). The same ghost text should not still be displayed.
        (0, vitest_1.expect)(await (0, helpers_1.getInlineCompletions)((0, helpers_1.params)(' █', [], { lastCandidate: candidate }))).toEqual({
            items: [],
            source: get_inline_completions_1.InlineCompletionsResultSource.Network,
        }));
    });
    (0, vitest_1.describe)('completeSuggestWidgetSelection', () => {
        (0, vitest_1.it)('is not reused when selected item info differs', async () => 
        // The user types `console`, sees the context menu pop up and receives a completion for
        // the first item. They now use the arrow keys to select the second item. The original
        // ghost text should not be reused as it won't be rendered anyways
        (0, vitest_1.expect)(await (0, helpers_1.getInlineCompletions)((0, helpers_1.params)('console.█', [], {
            lastCandidate: lastCandidate('console.█', ' = 1', {
                text: 'log',
                range: (0, textDocument_1.range)(0, 8, 0, 8),
            }),
            selectedCompletionInfo: {
                text: 'dir',
                range: (0, textDocument_1.range)(0, 8, 0, 8),
            },
            completeSuggestWidgetSelection: true,
            takeSuggestWidgetSelectionIntoAccount: true,
        }))).toEqual({
            items: [],
            source: get_inline_completions_1.InlineCompletionsResultSource.Network,
        }));
        (0, vitest_1.it)('is reused when typing forward as suggested and the selected item info differs', async () => 
        // The user types `export c`, sees the context menu pop up `class` and receives a completion for
        // the first item. They now type fotward as suggested and reach the next word of the completion `Agent`.
        // The context menu pop up shows a different suggestion `Agent` but the original ghost text can be
        // reused because user continues to type as suggested.
        (0, vitest_1.expect)(await (0, helpers_1.getInlineCompletions)((0, helpers_1.params)('export class A█', [], {
            lastCandidate: lastCandidate('export c█', 'lass Agent {', {
                text: 'class',
                range: (0, textDocument_1.range)(0, 8, 0, 8),
            }),
            selectedCompletionInfo: {
                text: 'Agent',
                range: (0, textDocument_1.range)(0, 8, 0, 8),
            },
            completeSuggestWidgetSelection: true,
            takeSuggestWidgetSelectionIntoAccount: true,
        }))).toEqual({
            items: [{ insertText: 'gent {' }],
            source: get_inline_completions_1.InlineCompletionsResultSource.LastCandidate,
        }));
        (0, vitest_1.it)('does not repeat injected suffix information when content is inserted', async () => (0, vitest_1.expect)(await (0, helpers_1.getInlineCompletionsInsertText)((0, helpers_1.params)('console.l█', [], {
            lastCandidate: lastCandidate('console.█', 'log("hello world")', {
                text: 'log',
                range: (0, textDocument_1.range)(0, 8, 0, 8),
            }),
            selectedCompletionInfo: {
                text: 'log',
                range: (0, textDocument_1.range)(0, 8, 0, 9),
            },
            completeSuggestWidgetSelection: true,
        }))).toEqual(['og("hello world")']));
        (0, vitest_1.it)('does not repeat injected suffix information when suggestion item is fully accepted', async () => (0, vitest_1.expect)(await (0, helpers_1.getInlineCompletionsInsertText)((0, helpers_1.params)('console.log█', [], {
            lastCandidate: lastCandidate('console.█', 'log("hello world")', {
                text: 'log',
                range: (0, textDocument_1.range)(0, 8, 0, 8),
            }),
            selectedCompletionInfo: undefined,
            completeSuggestWidgetSelection: true,
        }))).toEqual(['("hello world")']));
    });
});
