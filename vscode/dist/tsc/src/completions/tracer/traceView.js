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
exports.registerAutocompleteTraceView = void 0;
const vscode = __importStar(require("vscode"));
const cody_shared_1 = require("@sourcegraph/cody-shared");
const section_history_retriever_1 = require("../context/retrievers/section-history/section-history-retriever");
const get_inline_completions_1 = require("../get-inline-completions");
const statistics = __importStar(require("../statistics"));
/**
 * Registers a command `Cody: Open Autocomplete Trace View` that shows the context and prompt used
 * for autocomplete.
 */
function registerAutocompleteTraceView(provider) {
    let panel = null;
    let latestInvocationSequence = 0;
    return vscode.Disposable.from(vscode.commands.registerCommand('cody.autocomplete.openTraceView', () => {
        panel = vscode.window.createWebviewPanel('codyAutocompleteTraceView', 'Cody Autocomplete Trace View', vscode.ViewColumn.Two, {
            enableFindWidget: true,
        });
        panel.onDidDispose(() => {
            provider.setTracer(null);
            panel = null;
        });
        let data;
        function rerender() {
            if (!panel) {
                return;
            }
            if (!data) {
                panel.webview.html = renderWebviewHtml(data);
                return;
            }
            //  Only show data from the latest invocation.
            if (data.invocationSequence > latestInvocationSequence) {
                latestInvocationSequence = data.invocationSequence;
            }
            else if (data.invocationSequence < latestInvocationSequence) {
                return;
            }
            panel.webview.html = renderWebviewHtml(data);
        }
        rerender();
        const unsubscribeStatistics = statistics.registerChangeListener(rerender);
        const unsubscribeSectionObserver = (0, section_history_retriever_1.registerDebugListener)(rerender);
        provider.setTracer(_data => {
            data = _data;
            rerender();
        });
        return {
            dispose: () => {
                unsubscribeStatistics();
                unsubscribeSectionObserver();
            },
        };
    }), {
        dispose() {
            if (panel) {
                panel.dispose();
                panel = null;
            }
        },
    });
}
exports.registerAutocompleteTraceView = registerAutocompleteTraceView;
function renderWebviewHtml(data) {
    const markdownSource = [
        `# Cody autocomplete trace view${data ? ` (#${data.invocationSequence})` : ''}`,
        statisticSummary(),
        data ? null : 'Waiting for you to trigger a completion...',
        data?.modTime && data?.startTime ? `Time: ${Math.round(data.modTime - data.startTime)}ms` : null,
        data?.params &&
            `
## Params

- ${markdownInlineCode(vscode.workspace.asRelativePath(data.params.document.fileName))} @ ${data.params.position.line + 1}:${data.params.position.character + 1}
- triggerKind: ${data.params.triggerKind}
- selectedCompletionInfo: ${data.params.selectedCompletionInfo
                ? selectedCompletionInfoDescription(data.params.selectedCompletionInfo, data.params.document)
                : 'none'}
`,
        data?.completers &&
            `
## Completers

${data.completers?.map(({ id, docContext: { prefix, suffix }, completionIntent, position, document, ...otherOptions }) => `
### ${id}

${codeDetailsWithSummary('Prefix', prefix, 'end')}
${codeDetailsWithSummary('Suffix', suffix, 'start')}

${markdownList({ ...otherOptions, completionIntent: completionIntent || 'unknown' })}
`)}`,
        data?.context === undefined
            ? ''
            : `
## Context

${data.context ? markdownList(data.context.logSummary) : ''}

${data.context === null || data.context.context.length === 0
                ? 'No context.'
                : data.context.context
                    .map(contextSnippet => codeDetailsWithSummary(`${(0, cody_shared_1.displayPath)(contextSnippet.uri)}${'symbol' in contextSnippet ? `#${contextSnippet.symbol}` : ''} (${contextSnippet.content.length} chars)`, contextSnippet.content, 'start'))
                    .join('\n\n')}
`,
        data?.completionProviderCallParams &&
            `
## Completion provider calls

${codeDetailsWithSummary('Params', JSON.stringify(data.completionProviderCallParams, null, 2))}

${data.completionProviderCallResult
                ? [
                    codeDetailsWithSummary('Result', JSON.stringify(data.completionProviderCallResult.completions, null, 2)),
                    data.completionProviderCallResult.debugMessage
                        ? codeDetailsWithSummary('Timing', data.completionProviderCallResult.debugMessage, undefined, undefined, true)
                        : null,
                ]
                    .filter(cody_shared_1.isDefined)
                    .join('\n\n')
                : '_Loading result..._'}

`,
        data?.result === undefined
            ? ''
            : `
## Completions

${(data.result
                ? [
                    `- source: ${get_inline_completions_1.InlineCompletionsResultSource[data.result.source]}`,
                    `- logId: \`${data.result.logId}\``,
                ]
                : []).join('\n')}

${data.result === null
                ? '`null`'
                : data.result.items.length === 0
                    ? 'Empty completions.'
                    : data.result.items
                        .map(item => inlineCompletionItemDescription(item, data.params?.document))
                        .join('\n\n---\n\n')}`,
        data?.error &&
            `
## Error

${markdownCodeBlock(data.error)}
`,
        section_history_retriever_1.SectionHistoryRetriever.instance
            ? `
## Document sections

${documentSections()}`
            : '',
        `
## Advanced tools

${codeDetailsWithSummary('JSON for dataset', jsonForDataset(data))}

`,
    ]
        .filter(cody_shared_1.isDefined)
        .filter(s => s !== '')
        .map(s => s.trim())
        .join('\n\n---\n\n');
    return (0, cody_shared_1.renderMarkdown)(markdownSource, { noDomPurify: true });
}
function statisticSummary() {
    const { accepted, suggested } = statistics.getStatistics();
    return `📈 Suggested: ${suggested} | Accepted: ${accepted} | Acceptance rate: ${suggested === 0 ? 'N/A' : `${((accepted / suggested) * 100).toFixed(2)}%`}`;
}
function documentSections() {
    if (!section_history_retriever_1.SectionHistoryRetriever.instance) {
        return '';
    }
    return `\`\`\`\n${section_history_retriever_1.SectionHistoryRetriever.instance.debugPrint()}\n\`\`\``;
}
function codeDetailsWithSummary(title, value, anchor = 'none', excerptLength = 50, open = false) {
    const excerpt = anchor === 'start'
        ? value.slice(0, excerptLength)
        : anchor === 'end'
            ? value.slice(-excerptLength)
            : null;
    const excerptMarkdown = excerpt === null
        ? ''
        : `: <code>${anchor === 'end' ? '⋯' : ''}${withVisibleWhitespace(excerpt)
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')}${anchor === 'start' ? '⋯' : ''}</code>`;
    return `
<details${open ? ' open' : ''}>
<summary>${title}${excerptMarkdown}</summary>

${markdownCodeBlock(value)}

</details>`;
}
function markdownInlineCode(value) {
    return `\`${value.replaceAll('`', '\\`')}\``;
}
function markdownCodeBlock(value) {
    return '```\n' + value.replaceAll('`', '\\`') + '\n```\n';
}
function markdownList(object) {
    return Object.keys(object)
        .sort()
        .map(key => `- ${key}: ${JSON.stringify(object[key], null, 2)}`)
        .join('\n');
}
function selectedCompletionInfoDescription({ range, text }, document) {
    return `${markdownInlineCode(withVisibleWhitespace(text))}, replacing ${rangeDescriptionWithCurrentText(range, document)}`;
}
function inlineCompletionItemDescription(item, document) {
    return `${markdownCodeBlock(withVisibleWhitespace(item.insertText))}
${item.range
        ? `replacing ${rangeDescriptionWithCurrentText(new vscode.Range(item.range.start.line, item.range.start.character, item.range.end.line, item.range.end.character), document)}`
        : 'inserting at cursor'}`;
}
function rangeDescription(range) {
    // The VS Code extension API uses 0-indexed lines and columns, but the UI (and humans) use
    // 1-indexed lines and columns. Show the latter.
    return `${range.start.line + 1}:${range.start.character + 1}${range.isEmpty
        ? ''
        : `-${range.end.line === range.start.line ? '' : `${range.end.line + 1}:`}${range.end.character + 1}`}`;
}
function rangeDescriptionWithCurrentText(range, document) {
    return `${rangeDescription(range)} (${range.isEmpty
        ? 'empty'
        : document
            ? markdownInlineCode(withVisibleWhitespace(document.getText(range)))
            : 'unknown replacement text'})`;
}
function withVisibleWhitespace(text) {
    return text.replaceAll(' ', '·').replaceAll('\t', '⇥').replaceAll(/\r?\n/g, '↵');
}
function jsonForDataset(data) {
    const completer = data?.completers?.[0];
    if (!completer) {
        return '';
    }
    return `{
        context: ${JSON.stringify(data?.context?.context.map(c => ({ fileUri: c.uri.toString(), content: c.content })))},
        uri: ${JSON.stringify(completer.document.uri.toString())},
        languageId: ${JSON.stringify(completer.document.languageId)},
        content: \`${completer.docContext.prefix}$\{CURSOR}${completer.docContext.suffix}\`,
    }`;
}
