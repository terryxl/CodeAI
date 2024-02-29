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
exports.DefaultContextStrategyFactory = void 0;
const vscode = __importStar(require("vscode"));
const jaccard_similarity_retriever_1 = require("./retrievers/jaccard-similarity/jaccard-similarity-retriever");
const section_history_retriever_1 = require("./retrievers/section-history/section-history-retriever");
class DefaultContextStrategyFactory {
    contextStrategy;
    disposables = [];
    localRetriever;
    graphRetriever;
    constructor(contextStrategy, createBfgRetriever) {
        this.contextStrategy = contextStrategy;
        switch (contextStrategy) {
            case 'none':
                break;
            case 'bfg-mixed':
            case 'bfg':
                // The bfg strategy uses jaccard similarity as a fallback if no results are found or
                // the language is not supported by BFG
                this.localRetriever = new jaccard_similarity_retriever_1.JaccardSimilarityRetriever();
                this.disposables.push(this.localRetriever);
                if (createBfgRetriever) {
                    this.graphRetriever = createBfgRetriever();
                    this.disposables.push(this.graphRetriever);
                }
                break;
            case 'jaccard-similarity':
                this.localRetriever = new jaccard_similarity_retriever_1.JaccardSimilarityRetriever();
                this.disposables.push(this.localRetriever);
                break;
            case 'local-mixed':
                this.localRetriever = new jaccard_similarity_retriever_1.JaccardSimilarityRetriever();
                // Filling the graphRetriever field with another local retriever but that's alright
                // we simply mix them later anyways.
                this.graphRetriever = section_history_retriever_1.SectionHistoryRetriever.createInstance();
                this.disposables.push(this.localRetriever, this.graphRetriever);
        }
    }
    getStrategy(document) {
        const retrievers = [];
        switch (this.contextStrategy) {
            case 'none': {
                break;
            }
            // The bfg strategy exclusively uses bfg strategy when the language is supported
            case 'bfg':
                if (this.graphRetriever?.isSupportedForLanguageId(document.languageId)) {
                    retrievers.push(this.graphRetriever);
                }
                else if (this.localRetriever) {
                    retrievers.push(this.localRetriever);
                }
                break;
            // The bfg mixed strategy mixes local and graph based retrievers
            case 'bfg-mixed':
                if (this.graphRetriever?.isSupportedForLanguageId(document.languageId)) {
                    retrievers.push(this.graphRetriever);
                }
                if (this.localRetriever) {
                    retrievers.push(this.localRetriever);
                }
                break;
            // The local mixed strategy combines two local retrievers
            case 'local-mixed':
                if (this.localRetriever) {
                    retrievers.push(this.localRetriever);
                }
                if (this.graphRetriever) {
                    retrievers.push(this.graphRetriever);
                }
                break;
            // The jaccard similarity strategies only uses the local retriever
            case 'jaccard-similarity': {
                if (this.localRetriever) {
                    retrievers.push(this.localRetriever);
                }
                break;
            }
        }
        return { name: this.contextStrategy, retrievers };
    }
    dispose() {
        vscode.Disposable.from(...this.disposables).dispose();
    }
}
exports.DefaultContextStrategyFactory = DefaultContextStrategyFactory;
