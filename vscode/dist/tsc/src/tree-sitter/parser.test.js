"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const test_helpers_1 = require("./test-helpers");
(0, vitest_1.describe)('lexical analysis', () => {
    (0, vitest_1.describe)('experiment', () => {
        (0, vitest_1.it)('finds error nodes', async () => {
            const parser = await (0, test_helpers_1.initTreeSitterParser)();
            if (parser === undefined) {
                throw new Error('Tree-sitter parser is not initialized');
            }
            const tree = parser.parse('console.log(1)\nfunction example(');
            const query = parser.getLanguage().query('(ERROR) @error');
            const matches = query.matches(tree.rootNode);
            const [{ captures }] = (0, test_helpers_1.formatMatches)(matches);
            (0, vitest_1.expect)(captures).toMatchInlineSnapshot(`
              [
                {
                  "end": {
                    "column": 17,
                    "row": 1,
                  },
                  "name": "error",
                  "start": {
                    "column": 0,
                    "row": 1,
                  },
                  "text": "function example(",
                },
              ]
            `);
        });
    });
});
