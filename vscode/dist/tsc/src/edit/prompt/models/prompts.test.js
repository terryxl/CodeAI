"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const cody_shared_1 = require("@sourcegraph/cody-shared");
const claude_1 = require("./claude");
const openai_1 = require("./openai");
(0, vitest_1.describe)('Edit Prompts', () => {
    const fixupTask = {
        uri: (0, cody_shared_1.testFileUri)('src/file/index.ts'),
        followingText: "const text = 'Hello, world!'\n",
        selectedText: 'return text',
        precedingText: '\n}',
        instruction: 'Console log text',
    };
    function normalize(text) {
        return (0, cody_shared_1.isWindows)() ? text.replaceAll('src\\file\\index.ts', 'src/file/index.ts') : text;
    }
    vitest_1.it.each([
        { name: 'claude', fn: claude_1.claude },
        { name: 'openai', fn: openai_1.openai },
    ])('$name builds prompts correctly', ({ fn }) => {
        const { prompt: editPrompt } = fn.getEdit(fixupTask);
        (0, vitest_1.expect)(normalize(editPrompt)).toMatchSnapshot('edit');
        const { prompt: docPrompt } = fn.getDoc(fixupTask);
        (0, vitest_1.expect)(normalize(docPrompt)).toMatchSnapshot('doc');
        const { prompt: addPrompt } = fn.getAdd(fixupTask);
        (0, vitest_1.expect)(normalize(addPrompt)).toMatchSnapshot('add');
        const { prompt: fixPrompt } = fn.getFix(fixupTask);
        (0, vitest_1.expect)(normalize(fixPrompt)).toMatchSnapshot('fix');
        const { prompt: testPrompt } = fn.getTest(fixupTask);
        (0, vitest_1.expect)(normalize(testPrompt)).toMatchSnapshot('test');
    });
});
