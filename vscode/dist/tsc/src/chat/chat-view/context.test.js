"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const context_1 = require("./context");
const cody_shared_1 = require("@sourcegraph/cody-shared");
(0, vitest_1.describe)('fuseContext', () => {
    const uri = (0, cody_shared_1.testFileUri)('test.ts');
    const keywordItems = [
        { text: '0', uri },
        { text: '1', uri },
        { text: '2', uri },
        { text: '3', uri },
        { text: '4', uri },
        { text: '5', uri },
        { text: '6', uri },
        { text: '7', uri },
        { text: '8', uri },
        { text: '9', uri },
    ];
    const embeddingsItems = [
        { text: 'A', uri },
        { text: 'B', uri },
        { text: 'C', uri },
    ];
    function joined(items) {
        return items.map(r => r.text).join('');
    }
    (0, vitest_1.it)('includes the right 80-20 split', () => {
        const maxChars = 10;
        const result = (0, context_1.fuseContext)(keywordItems, embeddingsItems, maxChars);
        (0, vitest_1.expect)(joined(result)).toEqual('01234567AB');
    });
    (0, vitest_1.it)('skips over large items in an attempt to optimize utilization', () => {
        const keywordItems = [
            { text: '0', uri },
            { text: '1', uri },
            { text: '2', uri },
            { text: '3', uri },
            { text: '4', uri },
            { text: '5', uri },
            { text: 'very large keyword item', uri },
            { text: '6', uri },
            { text: '7', uri },
            { text: '8', uri },
            { text: '9', uri },
        ];
        const embeddingsItems = [
            { text: 'A', uri },
            { text: 'very large embeddings item', uri },
            { text: 'B', uri },
            { text: 'C', uri },
        ];
        const maxChars = 10;
        const result = (0, context_1.fuseContext)(keywordItems, embeddingsItems, maxChars);
        (0, vitest_1.expect)(joined(result)).toEqual('01234567AB');
    });
    (0, vitest_1.it)('returns an empty array when maxChars is 0', () => {
        const result = (0, context_1.fuseContext)(keywordItems, embeddingsItems, 0);
        (0, vitest_1.expect)(result).toEqual([]);
    });
    (0, vitest_1.it)('includes all keyword items if there are no embeddings items', () => {
        const maxChars = 10;
        const result = (0, context_1.fuseContext)(keywordItems, [], maxChars);
        (0, vitest_1.expect)(joined(result)).toEqual('0123456789');
    });
});
