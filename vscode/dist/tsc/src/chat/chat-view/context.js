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
exports.fuseContext = exports.getEnhancedContext = void 0;
const vscode = __importStar(require("vscode"));
const cody_shared_1 = require("@sourcegraph/cody-shared");
const log_1 = require("../../log");
const chat_helpers_1 = require("./chat-helpers");
async function getEnhancedContext({ strategy, editor, text, providers, featureFlags, hints, }) {
    if (featureFlags.fusedContext) {
        return getEnhancedContextFused({
            strategy,
            editor,
            text,
            providers,
            featureFlags,
            hints,
        });
    }
    return (0, cody_shared_1.wrapInActiveSpan)('chat.enhancedContext', async (span) => {
        const searchContext = [];
        // use user attention context only if config is set to none
        if (strategy === 'none') {
            (0, log_1.logDebug)('SimpleChatPanelProvider', 'getEnhancedContext > none');
            searchContext.push(...getVisibleEditorContext(editor));
            return searchContext;
        }
        let hasEmbeddingsContext = false;
        // Get embeddings context if useContext Config is not set to 'keyword' only
        if (strategy !== 'keyword') {
            (0, log_1.logDebug)('SimpleChatPanelProvider', 'getEnhancedContext > embeddings (start)');
            const localEmbeddingsResults = searchEmbeddingsLocal(providers.localEmbeddings, text);
            try {
                const r = await localEmbeddingsResults;
                hasEmbeddingsContext = hasEmbeddingsContext || r.length > 0;
                searchContext.push(...r);
            }
            catch (error) {
                (0, log_1.logDebug)('SimpleChatPanelProvider', 'getEnhancedContext > local embeddings', error);
            }
            (0, log_1.logDebug)('SimpleChatPanelProvider', 'getEnhancedContext > embeddings (end)');
        }
        if (strategy !== 'embeddings') {
            (0, log_1.logDebug)('SimpleChatPanelProvider', 'getEnhancedContext > search');
            if (providers.remoteSearch) {
                try {
                    searchContext.push(...(await searchRemote(providers.remoteSearch, text)));
                }
                catch (error) {
                    // TODO: Error reporting
                    (0, log_1.logDebug)('SimpleChatPanelProvider.getEnhancedContext', 'remote search error', error);
                }
            }
            if (providers.symf) {
                try {
                    searchContext.push(...(await searchSymf(providers.symf, editor, text)));
                }
                catch (error) {
                    // TODO(beyang): handle this error better
                    (0, log_1.logDebug)('SimpleChatPanelProvider.getEnhancedContext', 'searchSymf error', error);
                }
            }
            (0, log_1.logDebug)('SimpleChatPanelProvider', 'getEnhancedContext > search (end)');
        }
        const priorityContext = await getPriorityContext(text, editor, searchContext);
        return priorityContext.concat(searchContext);
    });
}
exports.getEnhancedContext = getEnhancedContext;
async function getEnhancedContextFused({ strategy, editor, text, providers, hints, }) {
    return (0, cody_shared_1.wrapInActiveSpan)('chat.enhancedContextFused', async () => {
        // use user attention context only if config is set to none
        if (strategy === 'none') {
            (0, log_1.logDebug)('SimpleChatPanelProvider', 'getEnhancedContext > none');
            return getVisibleEditorContext(editor);
        }
        // Get embeddings context if useContext Config is not set to 'keyword' only
        const embeddingsContextItemsPromise = strategy !== 'keyword'
            ? retrieveContextGracefully(searchEmbeddingsLocal(providers.localEmbeddings, text), 'local-embeddings')
            : [];
        // Get search (symf or remote search) context if config is not set to 'embeddings' only
        const localSearchContextItemsPromise = providers.symf && strategy !== 'embeddings'
            ? retrieveContextGracefully(searchSymf(providers.symf, editor, text), 'symf')
            : [];
        const remoteSearchContextItemsPromise = providers.remoteSearch && strategy !== 'embeddings'
            ? await retrieveContextGracefully(searchRemote(providers.remoteSearch, text), 'remote-search')
            : [];
        const keywordContextItemsPromise = (async () => [
            ...(await localSearchContextItemsPromise),
            ...(await remoteSearchContextItemsPromise),
        ])();
        const [embeddingsContextItems, keywordContextItems] = await Promise.all([
            embeddingsContextItemsPromise,
            keywordContextItemsPromise,
        ]);
        const fusedContext = fuseContext(keywordContextItems, embeddingsContextItems, hints.maxChars);
        const priorityContext = await getPriorityContext(text, editor, fusedContext);
        return priorityContext.concat(fusedContext);
    });
}
async function searchRemote(remoteSearch, userText) {
    return (0, cody_shared_1.wrapInActiveSpan)('chat.context.embeddings.remote', async () => {
        if (!remoteSearch) {
            return [];
        }
        return (await remoteSearch.query(userText)).map(result => {
            return {
                text: result.content,
                range: new vscode.Range(result.startLine, 0, result.endLine, 0),
                uri: result.uri,
                source: 'unified',
                repoName: result.repoName,
                title: result.path,
                revision: result.commit,
            };
        });
    });
}
/**
 * Uses symf to conduct a local search within the current workspace folder
 */
async function searchSymf(symf, editor, userText, blockOnIndex = false) {
    return (0, cody_shared_1.wrapInActiveSpan)('chat.context.symf', async () => {
        if (!symf) {
            return [];
        }
        const workspaceRoot = editor.getWorkspaceRootUri();
        if (!workspaceRoot || !(0, cody_shared_1.isFileURI)(workspaceRoot)) {
            return [];
        }
        const indexExists = await symf.getIndexStatus(workspaceRoot);
        if (indexExists !== 'ready' && !blockOnIndex) {
            void symf.ensureIndex(workspaceRoot, { hard: false });
            return [];
        }
        const r0 = (await symf.getResults(userText, [workspaceRoot])).flatMap(async (results) => {
            const items = (await results).flatMap(async (result) => {
                const range = new vscode.Range(result.range.startPoint.row, result.range.startPoint.col, result.range.endPoint.row, result.range.endPoint.col);
                let text;
                try {
                    text = await editor.getTextEditorContentForFile(result.file, range);
                    if (!text) {
                        return [];
                    }
                }
                catch (error) {
                    (0, log_1.logError)('SimpleChatPanelProvider.searchSymf', `Error getting file contents: ${error}`);
                    return [];
                }
                return {
                    uri: result.file,
                    range,
                    source: 'search',
                    text,
                };
            });
            return (await Promise.all(items)).flat();
        });
        return (await Promise.all(r0)).flat();
    });
}
async function searchEmbeddingsLocal(localEmbeddings, text) {
    return (0, cody_shared_1.wrapInActiveSpan)('chat.context.embeddings.local', async () => {
        if (!localEmbeddings) {
            return [];
        }
        (0, log_1.logDebug)('SimpleChatPanelProvider', 'getEnhancedContext > searching local embeddings');
        const contextItems = [];
        const embeddingsResults = await localEmbeddings.getContext(text, cody_shared_1.NUM_CODE_RESULTS + cody_shared_1.NUM_TEXT_RESULTS);
        for (const result of embeddingsResults) {
            const range = new vscode.Range(new vscode.Position(result.startLine, 0), new vscode.Position(result.endLine, 0));
            contextItems.push({
                uri: result.uri,
                range,
                text: result.content,
                source: 'embeddings',
            });
        }
        return contextItems;
    });
}
const userAttentionRegexps = [
    /editor/,
    /(open|current|this|entire)\s+file/,
    /current(ly)?\s+open/,
    /have\s+open/,
];
function getCurrentSelectionContext(editor) {
    const selection = editor.getActiveTextEditorSelection();
    if (!selection?.selectedText) {
        return [];
    }
    let range;
    if (selection.selectionRange) {
        range = new vscode.Range(selection.selectionRange.start.line, selection.selectionRange.start.character, selection.selectionRange.end.line, selection.selectionRange.end.character);
    }
    return [
        {
            text: selection.selectedText,
            uri: selection.fileUri,
            range,
            source: 'selection',
        },
    ];
}
function getVisibleEditorContext(editor) {
    return (0, cody_shared_1.wrapInActiveSpan)('chat.context.visibleEditorContext', () => {
        const visible = editor.getActiveTextEditorVisibleContent();
        const fileUri = visible?.fileUri;
        if (!visible || !fileUri) {
            return [];
        }
        if (!visible.content.trim()) {
            return [];
        }
        return [
            {
                text: visible.content,
                uri: fileUri,
                source: 'editor',
            },
        ];
    });
}
async function getPriorityContext(text, editor, retrievedContext) {
    return (0, cody_shared_1.wrapInActiveSpan)('chat.context.priority', async () => {
        const priorityContext = [];
        const selectionContext = getCurrentSelectionContext(editor);
        if (selectionContext.length > 0) {
            priorityContext.push(...selectionContext);
        }
        else if (needsUserAttentionContext(text)) {
            // Query refers to current editor
            priorityContext.push(...getVisibleEditorContext(editor));
        }
        else if (needsReadmeContext(editor, text)) {
            // Query refers to project, so include the README
            let containsREADME = false;
            for (const contextItem of retrievedContext) {
                const basename = (0, cody_shared_1.uriBasename)(contextItem.uri);
                if (basename.toLocaleLowerCase() === 'readme' ||
                    basename.toLocaleLowerCase().startsWith('readme.')) {
                    containsREADME = true;
                    break;
                }
            }
            if (!containsREADME) {
                priorityContext.push(...(await getReadmeContext()));
            }
        }
        return priorityContext;
    });
}
function needsUserAttentionContext(input) {
    const inputLowerCase = input.toLowerCase();
    // If the input matches any of the `editorRegexps` we assume that we have to include
    // the editor context (e.g., currently open file) to the overall message context.
    for (const regexp of userAttentionRegexps) {
        if (inputLowerCase.match(regexp)) {
            return true;
        }
    }
    return false;
}
function needsReadmeContext(editor, input) {
    input = input.toLowerCase();
    const question = extractQuestion(input);
    if (!question) {
        return false;
    }
    // split input into words, discarding spaces and punctuation
    const words = input.split(/\W+/).filter(w => w.length > 0);
    const bagOfWords = Object.fromEntries(words.map(w => [w, true]));
    const projectSignifiers = [
        'project',
        'repository',
        'repo',
        'library',
        'package',
        'module',
        'codebase',
    ];
    const questionIndicators = ['what', 'how', 'describe', 'explain', '?'];
    const workspaceUri = editor.getWorkspaceRootUri();
    if (workspaceUri) {
        const rootBase = workspaceUri.toString().split('/').at(-1);
        if (rootBase) {
            projectSignifiers.push(rootBase.toLowerCase());
        }
    }
    let containsProjectSignifier = false;
    for (const p of projectSignifiers) {
        if (bagOfWords[p]) {
            containsProjectSignifier = true;
            break;
        }
    }
    let containsQuestionIndicator = false;
    for (const q of questionIndicators) {
        if (bagOfWords[q]) {
            containsQuestionIndicator = true;
            break;
        }
    }
    return containsQuestionIndicator && containsProjectSignifier;
}
async function getReadmeContext() {
    // global pattern for readme file
    const readmeGlobalPattern = '{README,README.,readme.,Readm.}*';
    const readmeUri = (await vscode.workspace.findFiles(readmeGlobalPattern, undefined, 1)).at(0);
    if (!readmeUri?.path) {
        return [];
    }
    const readmeDoc = await vscode.workspace.openTextDocument(readmeUri);
    const readmeText = readmeDoc.getText();
    const { truncated: truncatedReadmeText, range } = (0, cody_shared_1.truncateTextNearestLine)(readmeText, cody_shared_1.MAX_BYTES_PER_FILE);
    if (truncatedReadmeText.length === 0) {
        return [];
    }
    return [
        {
            uri: readmeUri,
            text: truncatedReadmeText,
            range: (0, chat_helpers_1.viewRangeToRange)(range),
            source: 'editor',
        },
    ];
}
function extractQuestion(input) {
    input = input.trim();
    const q = input.indexOf('?');
    if (q !== -1) {
        return input.slice(0, q + 1).trim();
    }
    if (input.length < 100) {
        return input;
    }
    return undefined;
}
async function retrieveContextGracefully(promise, strategy) {
    try {
        (0, log_1.logDebug)('SimpleChatPanelProvider', `getEnhancedContext > ${strategy} (start)`);
        return await promise;
    }
    catch (error) {
        (0, log_1.logError)('SimpleChatPanelProvider', `getEnhancedContext > ${strategy}' (error)`, error);
        return [];
    }
    finally {
        (0, log_1.logDebug)('SimpleChatPanelProvider', `getEnhancedContext > ${strategy} (end)`);
    }
}
// A simple context fusion engine that picks the top most keyword results to fill up 80% of the
// context window and picks the top ranking embeddings items for the remainder.
function fuseContext(keywordItems, embeddingsItems, maxChars) {
    let charsUsed = 0;
    const fused = [];
    const maxKeywordChars = embeddingsItems.length > 0 ? maxChars * 0.8 : maxChars;
    for (const item of keywordItems) {
        const len = item.text.length;
        if (charsUsed + len <= maxKeywordChars) {
            charsUsed += len;
            fused.push(item);
        }
    }
    for (const item of embeddingsItems) {
        const len = item.text.length;
        if (charsUsed + len <= maxChars) {
            charsUsed += len;
            fused.push(item);
        }
    }
    return fused;
}
exports.fuseContext = fuseContext;
