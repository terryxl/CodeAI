"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContextMixer = void 0;
const cody_shared_1 = require("@sourcegraph/cody-shared");
const reciprocal_rank_fusion_1 = require("./reciprocal-rank-fusion");
/**
 * The context mixer is responsible for combining multiple context retrieval strategies into a
 * single proposed context list.
 *
 * This is done by ranking the order of documents using reciprocal rank fusion and then combining
 * the snippets from each retriever into a single list using top-k (so we will pick all returned
 * ranged for the top ranked document from all retrieval sources before we move on to the second
 * document).
 */
class ContextMixer {
    strategyFactory;
    constructor(strategyFactory) {
        this.strategyFactory = strategyFactory;
    }
    async getContext(options) {
        const start = performance.now();
        const { name: strategy, retrievers } = this.strategyFactory.getStrategy(options.document);
        if (retrievers.length === 0) {
            return {
                context: [],
                logSummary: {
                    strategy: 'none',
                    totalChars: 0,
                    duration: 0,
                    retrieverStats: {},
                },
            };
        }
        const results = await Promise.all(retrievers.map(async (retriever) => {
            const retrieverStart = performance.now();
            const allSnippets = await (0, cody_shared_1.wrapInActiveSpan)(`autocomplete.retrieve.${retriever.identifier}`, () => retriever.retrieve({
                ...options,
                hints: {
                    maxChars: options.maxChars,
                    maxMs: 150,
                },
            }));
            const filteredSnippets = allSnippets.filter(snippet => !(0, cody_shared_1.isCodyIgnoredFile)(snippet.uri));
            return {
                identifier: retriever.identifier,
                duration: performance.now() - retrieverStart,
                snippets: new Set(filteredSnippets),
            };
        }));
        const fusedResults = (0, reciprocal_rank_fusion_1.fuseResults)(results.map(r => r.snippets), result => {
            // Ensure that context retrieved via BFG works where we do not have a startLine and
            // endLine yet.
            if (typeof result.startLine === 'undefined' || typeof result.endLine === 'undefined') {
                return [result.uri.toString()];
            }
            const lineIds = [];
            for (let i = result.startLine; i <= result.endLine; i++) {
                lineIds.push(`${result.uri.toString()}:${i}`);
            }
            return lineIds;
        });
        // The total chars size hint is inclusive of the prefix and suffix sizes, so we seed the
        // total chars with the prefix and suffix sizes.
        let totalChars = options.docContext.prefix.length + options.docContext.suffix.length;
        const mixedContext = [];
        const retrieverStats = {};
        let position = 0;
        for (const snippet of fusedResults) {
            if (totalChars + snippet.content.length > options.maxChars) {
                continue;
            }
            mixedContext.push(snippet);
            totalChars += snippet.content.length;
            // For analytics purposes, find out which retriever has yielded this result and
            // summarize the stats in retrieverStats.
            const retrieverId = results.find(r => r.snippets.has(snippet))?.identifier;
            if (retrieverId) {
                if (!retrieverStats[retrieverId]) {
                    retrieverStats[retrieverId] = {
                        suggestedItems: 0,
                        positionBitmap: 0,
                        retrievedItems: results.find(r => r.identifier === retrieverId)?.snippets.size ?? 0,
                        duration: results.find(r => r.identifier === retrieverId)?.duration ?? 0,
                    };
                }
                retrieverStats[retrieverId].suggestedItems++;
                // Only log the position for the first 32 results to avoid overflowing the bitmap
                if (position < 32) {
                    retrieverStats[retrieverId].positionBitmap |= 1 << position;
                }
            }
            position++;
        }
        const logSummary = {
            strategy,
            duration: performance.now() - start,
            totalChars,
            retrieverStats,
        };
        return {
            context: mixedContext,
            logSummary,
        };
    }
    dispose() {
        this.strategyFactory.dispose();
    }
}
exports.ContextMixer = ContextMixer;
