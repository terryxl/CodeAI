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
const cody_shared_1 = require("@sourcegraph/cody-shared");
const get_current_doc_context_1 = require("../../../get-current-doc-context");
const test_helpers_1 = require("../../../test-helpers");
const jaccard_similarity_retriever_1 = require("./jaccard-similarity-retriever");
const { document: testDocument, position: testPosition } = (0, test_helpers_1.documentAndPosition)((0, dedent_1.default) `
        // Write a test for the class TestClass
        █
    `, 'typescript', (0, cody_shared_1.testFileUri)('test-class.test.ts').toString());
const testDocContext = (0, get_current_doc_context_1.getCurrentDocContext)({
    document: testDocument,
    position: testPosition,
    maxPrefixLength: 100,
    maxSuffixLength: 0,
    dynamicMultilineCompletions: false,
});
const DEFAULT_HINTS = {
    maxChars: 1000,
    maxMs: 100,
};
(0, vitest_1.describe)('JaccardSimilarityRetriever', () => {
    const otherDocument = (0, test_helpers_1.document)((0, dedent_1.default) `
            export class TestClass {
                // Method 1 of TestClass
                methodOne() {
                    console.log('one')
                }




                // Method 2 of TestClass
                methodTwo() {
                    console.log('two')
                }
            }
        `, 'typescript', (0, cody_shared_1.testFileUri)('test-class.ts').toString());
    const unrelatedDocument = (0, test_helpers_1.document)((0, dedent_1.default) `
            I like turtles
        `, 'typescript', (0, cody_shared_1.testFileUri)('unrelated.ts').toString());
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.spyOn(vscode.window, 'visibleTextEditors', 'get').mockReturnValue([
            { document: testDocument },
            { document: otherDocument },
            { document: unrelatedDocument },
        ]);
        vitest_1.vi.spyOn(vscode.workspace, 'openTextDocument').mockImplementation(((uri) => {
            if (uri?.toString().includes('unrelated')) {
                return Promise.resolve(unrelatedDocument);
            }
            if (uri?.toString().includes('test-class.test')) {
                return Promise.resolve(testDocument);
            }
            return Promise.resolve(otherDocument);
        }));
    });
    (0, vitest_1.it)('should retrieve relevant context snippets from other files, based on the editor prefix', async () => {
        const retriever = new jaccard_similarity_retriever_1.JaccardSimilarityRetriever();
        const snippets = await retriever.retrieve({
            document: testDocument,
            position: testDocContext.position,
            docContext: testDocContext,
            hints: DEFAULT_HINTS,
            abortSignal: new AbortController().signal,
        });
        // With the default window size, the whole test class will be included
        //
        // NOTE: We leave a big gap here of lines that does not matched our source line at all so we
        // force the algorithm to not merge the two sections.
        (0, vitest_1.expect)(snippets[0].content).toMatchInlineSnapshot(`
          "export class TestClass {
              // Method 1 of TestClass
              methodOne() {
                  console.log('one')
              }




              // Method 2 of TestClass
              methodTwo() {
                  console.log('two')
              }
          }"
        `);
        // The unrelated file should not be added since it does not overlap with the query at all
        (0, vitest_1.expect)(snippets[1]).toBeUndefined();
    });
    (0, vitest_1.it)('should pick multiple matches from the same file', async () => {
        // We limit the window size to 4 lines
        const retriever = new jaccard_similarity_retriever_1.JaccardSimilarityRetriever(4);
        const snippets = await retriever.retrieve({
            document: testDocument,
            position: testDocContext.position,
            docContext: testDocContext,
            hints: { ...DEFAULT_HINTS, maxChars: 100 },
            abortSignal: new AbortController().signal,
        });
        (0, vitest_1.expect)(snippets).toHaveLength(2);
        // The first snippet contains the top of the file...
        (0, vitest_1.expect)(snippets[0].content).toMatchInlineSnapshot(`
          "export class TestClass {
              // Method 1 of TestClass
              methodOne() {
                  console.log('one')"
        `);
        // ...the second one contains the bottom.
        (0, vitest_1.expect)(snippets[1].content).toMatchInlineSnapshot(`
          "    // Method 2 of TestClass
              methodTwo() {
                  console.log('two')
              }"
        `);
    });
    (0, vitest_1.it)('should include matches from the same file that do not overlap the prefix/suffix', async () => {
        // We limit the window size to 3 lines
        const retriever = new jaccard_similarity_retriever_1.JaccardSimilarityRetriever(3);
        const { document: testDocument, position: testPosition } = (0, test_helpers_1.documentAndPosition)((0, dedent_1.default) `
                // Write a test for TestClass
                █



                class TestClass {
                    // Maybe this is relevant tho?
                }
            `, 'typescript', (0, cody_shared_1.testFileUri)('test-class.test.ts').toString());
        vitest_1.vi.spyOn(vscode.window, 'visibleTextEditors', 'get').mockReturnValue([
            { document: testDocument },
        ]);
        vitest_1.vi.spyOn(vscode.workspace, 'openTextDocument').mockImplementation(uri => {
            return Promise.resolve(testDocument);
        });
        const testDocContext = (0, get_current_doc_context_1.getCurrentDocContext)({
            document: testDocument,
            position: testPosition,
            maxPrefixLength: 100,
            maxSuffixLength: 0,
            dynamicMultilineCompletions: false,
        });
        const snippets = await retriever.retrieve({
            document: testDocument,
            position: testDocContext.position,
            docContext: testDocContext,
            hints: DEFAULT_HINTS,
            abortSignal: new AbortController().signal,
        });
        (0, vitest_1.expect)(snippets[0].content).toMatchInlineSnapshot(`
          "class TestClass {
              // Maybe this is relevant tho?
          }"
        `);
    });
});
