"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dedent_1 = __importDefault(require("dedent"));
const vitest_1 = require("vitest");
const test_helpers_1 = require("../test-helpers");
const helpers_1 = require("./helpers");
(0, vitest_1.describe)('[getInlineCompletions] windows ', () => {
    (0, vitest_1.it)('works works with \\r\\n line terminators', async () => {
        const completionResponse = (0, test_helpers_1.completion) `
                ├if (foo) {
                    console.log('foo1');
                }
            }

            add() {
                console.log('bar')
            }┤
        ┴┴┴┴`;
        completionResponse.completion = windowsify(completionResponse.completion);
        const items = await (0, helpers_1.getInlineCompletionsInsertText)((0, helpers_1.params)(windowsify((0, dedent_1.default) `
                    class Foo {
                        constructor() {
                            █
                        }
                    }
                `), [completionResponse]));
        (0, vitest_1.expect)(items[0]).toBe("if (foo) {\n            console.log('foo1');\n        }");
    });
});
function windowsify(string) {
    return string.replaceAll('\n', '\r\n');
}
