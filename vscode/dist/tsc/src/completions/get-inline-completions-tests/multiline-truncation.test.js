"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dedent_1 = __importDefault(require("dedent"));
const vitest_1 = require("vitest");
const grammars_1 = require("../../tree-sitter/grammars");
const parser_1 = require("../../tree-sitter/parser");
const test_helpers_1 = require("../test-helpers");
const helpers_1 = require("./helpers");
const cases = [true, false];
// Run truncation tests for both strategies: indentation-based and tree-sitter-based.
// We cannot use `describe.each` here because `toMatchInlineSnapshot` is not supported with it.
for (const isTreeSitterEnabled of cases) {
    const label = isTreeSitterEnabled ? 'enabled' : 'disabled';
    (0, vitest_1.describe)(`[getInlineCompletions] multiline truncation with tree-sitter ${label}`, () => {
        (0, vitest_1.describe)('python', () => {
            (0, vitest_1.beforeAll)(async () => {
                if (isTreeSitterEnabled) {
                    await (0, test_helpers_1.initTreeSitterParser)(grammars_1.SupportedLanguage.Python);
                }
            });
            (0, vitest_1.afterAll)(() => {
                (0, parser_1.resetParsersCache)();
            });
            (0, vitest_1.it)('truncates multiline completions based on tree-sitter query', async () => {
                (0, vitest_1.expect)((await (0, helpers_1.getInlineCompletionsInsertText)((0, helpers_1.params)((0, dedent_1.default) `
                                    def foo():
                                        █
                                    `, [
                    (0, test_helpers_1.completion) `
                                    return "foo"
                            println("bar")
                                `,
                ], {
                    languageId: 'python',
                })))[0]).toBe((0, dedent_1.default) `
                    return "foo"
                `);
            });
            (0, vitest_1.it)('truncates multiline completions and keeps full if statements', async () => {
                (0, vitest_1.expect)((await (0, helpers_1.getInlineCompletionsInsertText)((0, helpers_1.params)((0, dedent_1.default) `
                                    if true:
                                        █
                                    `, [
                    (0, test_helpers_1.completion) `
                                    println(1)
                                elif false:
                                    println(2)
                                else:
                                    println(3)

                                println(4)
                                `,
                ], {
                    languageId: 'python',
                })))[0]).toMatchInlineSnapshot(`
                  "println(1)
                  elif false:
                      println(2)
                  else:
                      println(3)"
                `);
            });
        });
        (0, vitest_1.describe)('ts', () => {
            (0, vitest_1.beforeAll)(async () => {
                if (isTreeSitterEnabled) {
                    await (0, test_helpers_1.initTreeSitterParser)();
                }
            });
            (0, vitest_1.afterAll)(() => {
                (0, parser_1.resetParsersCache)();
            });
            (0, vitest_1.it)('removes trailing spaces', async () => {
                (0, vitest_1.expect)((await (0, helpers_1.getInlineCompletionsInsertText)((0, helpers_1.params)((0, dedent_1.default) `
                    function bubbleSort() {
                        █
                    }`, [
                    (0, test_helpers_1.completion) `
                        ├console.log('foo')${' '}
                        console.log('bar')${'    '}
                        console.log('baz')${'  '}┤
                    ┴┴┴┴`,
                ])))[0]).toMatchInlineSnapshot(`
                "console.log('foo')
                    console.log('bar')
                    console.log('baz')"
            `);
            });
            (0, vitest_1.it)('honors a leading new line in the completion', async () => {
                const items = await (0, helpers_1.getInlineCompletionsInsertText)((0, helpers_1.params)((0, dedent_1.default) `
                    describe('bubbleSort', () => {
                        it('bubbleSort it case', () => {█

                        })
                    })`, [
                    (0, test_helpers_1.completion) `
                            ├${'  '}
                            const unsortedArray = [4,3,78,2,0,2]
                            const sortedArray = bubbleSort(unsortedArray)
                            expect(sortedArray).toEqual([0,2,2,3,4,78])
                        })
                    }┤`,
                ]));
                (0, vitest_1.expect)(items[0]).toMatchInlineSnapshot(`
              "
                      const unsortedArray = [4,3,78,2,0,2]
                      const sortedArray = bubbleSort(unsortedArray)
                      expect(sortedArray).toEqual([0,2,2,3,4,78])"
            `);
            });
            (0, vitest_1.it)('cuts-off redundant closing brackets on the start indent level', async () => {
                const items = await (0, helpers_1.getInlineCompletionsInsertText)((0, helpers_1.params)((0, dedent_1.default) `
                    describe('bubbleSort', () => {
                        it('bubbleSort it case', () => {█

                        })
                    })`, [
                    (0, test_helpers_1.completion) `
                            ├const unsortedArray = [4,3,78,2,0,2]
                            const sortedArray = bubbleSort(unsortedArray)
                            expect(sortedArray).toEqual([0,2,2,3,4,78])
                        })
                    }┤`,
                ]));
                (0, vitest_1.expect)(items[0]).toMatchInlineSnapshot(`
              "const unsortedArray = [4,3,78,2,0,2]
                      const sortedArray = bubbleSort(unsortedArray)
                      expect(sortedArray).toEqual([0,2,2,3,4,78])"
            `);
            });
            (0, vitest_1.it)('cuts-off redundant closing brackets for completions from extended triggers', async () => {
                const items = await (0, helpers_1.getInlineCompletionsInsertText)((0, helpers_1.params)((0, dedent_1.default) `function bubbleSort(█) {

                    }`, [
                    (0, test_helpers_1.completion) `
                        array: string[]): string[] {
                            let swapped
                            do {
                                swapped = false
                                for (let i = 0; i < array.length - 1; i++) {
                                    if (array[i] > array[i + 1]) {
                                        const temp = array[i]
                                        array[i] = array[i + 1]
                                        array[i + 1] = temp
                                        swapped = true
                                    }
                                }
                            } while (swapped)

                            return array
                        }`,
                ]));
                (0, vitest_1.expect)(items[0]).toMatchInlineSnapshot(`
              "array: string[]): string[] {
                  let swapped
                  do {
                      swapped = false
                      for (let i = 0; i < array.length - 1; i++) {
                          if (array[i] > array[i + 1]) {
                              const temp = array[i]
                              array[i] = array[i + 1]
                              array[i + 1] = temp
                              swapped = true
                          }
                      }
                  } while (swapped)

                  return array"
            `);
            });
            (0, vitest_1.it)('cuts-off redundant closing brackets on the start indent level', async () => {
                const items = await (0, helpers_1.getInlineCompletionsInsertText)((0, helpers_1.params)((0, dedent_1.default) `
                    describe('bubbleSort', () => {
                        it('bubbleSort it case', () => {█

                        })
                    })`, [
                    (0, test_helpers_1.completion) `
                            ├const unsortedArray = [4,3,78,2,0,2]
                            const sortedArray = bubbleSort(unsortedArray)
                            expect(sortedArray).toEqual([0,2,2,3,4,78])
                        })
                    }┤`,
                ]));
                (0, vitest_1.expect)(items[0]).toMatchInlineSnapshot(`
              "const unsortedArray = [4,3,78,2,0,2]
                      const sortedArray = bubbleSort(unsortedArray)
                      expect(sortedArray).toEqual([0,2,2,3,4,78])"
            `);
            });
            (0, vitest_1.it)('keeps the closing bracket', async () => {
                const items = await (0, helpers_1.getInlineCompletionsInsertText)((0, helpers_1.params)('function printHello(█)', [
                    (0, test_helpers_1.completion) `
                ├) {
                    console.log('Hello');
                }┤`,
                ]));
                (0, vitest_1.expect)(items[0]).toMatchInlineSnapshot(`
              ") {
                  console.log('Hello');
              }"
            `);
            });
            (0, vitest_1.it)('uses an indentation based approach to cut-off completions', async () => {
                const items = await (0, helpers_1.getInlineCompletionsInsertText)((0, helpers_1.params)((0, dedent_1.default) `
                    class Foo {
                        constructor() {
                            █
                        }
                    }
                `, [
                    (0, test_helpers_1.completion) `
                            ├console.log('foo')
                        }

                        add() {
                            console.log('bar')
                        }┤
                    ┴┴┴┴`,
                    (0, test_helpers_1.completion) `
                            ├if (foo) {
                                console.log('foo1');
                            }
                        }

                        add() {
                            console.log('bar')
                        }┤
                    ┴┴┴┴`,
                ], {
                    providerOptions: { n: 2 },
                }));
                (0, vitest_1.expect)(items[0]).toBe("if (foo) {\n            console.log('foo1');\n        }");
                (0, vitest_1.expect)(items[1]).toBe("console.log('foo')");
            });
            (0, vitest_1.it)('cuts-off the whole completions when suffix is very similar to suffix line', async () => {
                (0, vitest_1.expect)((await (0, helpers_1.getInlineCompletionsInsertText)((0, helpers_1.params)((0, dedent_1.default) `
                    function() {
                        █
                        console.log('bar')
                    }
                `, [
                    (0, test_helpers_1.completion) `
                        ├console.log('foo')
                        console.log('bar')
                    }┤`,
                ]))).length).toBe(0);
            });
            (0, vitest_1.it)('skips over empty lines', async () => {
                (0, vitest_1.expect)((await (0, helpers_1.getInlineCompletionsInsertText)((0, helpers_1.params)((0, dedent_1.default) `
                    class Foo {
                        constructor() {
                            █
                        }
                    }
                `, [
                    (0, test_helpers_1.completion) `
                            ├console.log('foo')

                            console.log('bar')

                            console.log('baz')┤
                    ┴┴┴┴┴┴┴┴`,
                ])))[0]).toMatchInlineSnapshot(`
              "console.log('foo')

                      console.log('bar')

                      console.log('baz')"
            `);
            });
            (0, vitest_1.it)('skips over else blocks', async () => {
                (0, vitest_1.expect)((await (0, helpers_1.getInlineCompletionsInsertText)((0, helpers_1.params)((0, dedent_1.default) `
                    function whatever() {
                        console.log(123)
                    }
                    console.log(321); if (check) {
                        █
                    }
                `, [
                    (0, test_helpers_1.completion) `
                        ├console.log('one')
                    } else {
                        console.log('two')
                    }┤`,
                ])))[0]).toMatchInlineSnapshot(`
              "console.log('one')
              } else {
                  console.log('two')"
            `);
            });
            (0, vitest_1.it)('includes closing parentheses in the completion', async () => {
                (0, vitest_1.expect)((await (0, helpers_1.getInlineCompletionsInsertText)((0, helpers_1.params)((0, dedent_1.default) `
                if (check) {
                    █
                `, [
                    (0, test_helpers_1.completion) `
                        ├console.log('one')
                    }┤`,
                ])))[0]).toMatchInlineSnapshot(`
              "console.log('one')
              }"
            `);
            });
            (0, vitest_1.describe)('stops when the next non-empty line of the suffix matches partially', () => {
                (0, vitest_1.it)('simple example', async () => {
                    (0, vitest_1.expect)((await (0, helpers_1.getInlineCompletionsInsertText)((0, helpers_1.params)((0, dedent_1.default) `
                        path: $GITHUB_WORKSPACE/vscode/.vscode-it/█
                        key: {{ runner.os }}-pnpm-store-{{ hashFiles('**/pnpm-lock.yaml') }}`, [
                        (0, test_helpers_1.completion) `
                            ├pnpm-store
                            key: {{ runner.os }}-pnpm-{{ steps.pnpm-cache.outputs.STORE_PATH }}┤`,
                    ])))[0]).toBe('pnpm-store');
                });
                (0, vitest_1.it)('example with return', async () => {
                    (0, vitest_1.expect)((await (0, helpers_1.getInlineCompletionsInsertText)((0, helpers_1.params)((0, dedent_1.default) `
                        console.log('<< stop completion: █')
                        return []
                    `, [
                        (0, test_helpers_1.completion) `
                            lastChange was delete')
                            return []
                        `,
                    ])))[0]).toBe("lastChange was delete')");
                });
                (0, vitest_1.it)('example with inline comment', async () => {
                    (0, vitest_1.expect)((await (0, helpers_1.getInlineCompletionsInsertText)((0, helpers_1.params)((0, dedent_1.default) `
                        // █
                        const currentFilePath = path.normalize(document.fileName)
                    `, [
                        (0, test_helpers_1.completion) `
                            Get the file path
                            const filePath = normalize(document.fileName)
                        `,
                    ])))[0]).toBe('Get the file path');
                });
            });
            (0, vitest_1.it)('handles tab/newline interop in completion truncation', async () => {
                (0, vitest_1.expect)((await (0, helpers_1.getInlineCompletionsInsertText)((0, helpers_1.params)((0, dedent_1.default) `
                    class Foo {
                        constructor() {
                            █
                `, [
                    (0, test_helpers_1.completion) `
                        ├console.log('foo')
                ${helpers_1.T}${helpers_1.T}if (yes) {
                ${helpers_1.T}${helpers_1.T}    sure()
                ${helpers_1.T}${helpers_1.T}}
                ${helpers_1.T}}

                ${helpers_1.T}add() {┤
                ┴┴┴┴`,
                ])))[0]).toMatchInlineSnapshot(`
                "console.log('foo')
                \t\tif (yes) {
                \t\t    sure()
                \t\t}
                \t}"
            `);
            });
            (0, vitest_1.it)('does not include block end character if there is already closed bracket', async () => {
                (0, vitest_1.expect)((await (0, helpers_1.getInlineCompletionsInsertText)((0, helpers_1.params)(`
                if (check) {
                    █
                }`, [(0, test_helpers_1.completion) `}`]))).length).toBe(0);
            });
            (0, vitest_1.it)('does not include block end character if there is already closed bracket [sort example]', async () => {
                (0, vitest_1.expect)((await (0, helpers_1.getInlineCompletionsInsertText)((0, helpers_1.params)(`
                 function bubbleSort(arr: number[]): number[] {
                   for (let i = 0; i < arr.length; i++) {
                     for (let j = 0; j < (arr.length - i - 1); j++) {
                       if (arr[j] > arr[j + 1]) {
                         // swap elements
                         let temp = arr[j];
                         arr[j] = arr[j + 1];
                         arr[j + 1] = temp;
                       }
                       █
                     }
                   }
                   return arr;
                 }`, [(0, test_helpers_1.completion) `}`]))).length).toBe(0);
            });
            (0, vitest_1.it)('normalizes Cody responses starting with an empty line and following the exact same indentation as the start line', async () => {
                (0, vitest_1.expect)((await (0, helpers_1.getInlineCompletionsInsertText)((0, helpers_1.params)((0, dedent_1.default) `
                    function it() {
                        █
                `, [
                    (0, test_helpers_1.completion) `
                        ├
                        console.log('foo')┤
                    ┴┴┴┴`,
                ])))[0]).toBe("console.log('foo')");
            });
            if (isTreeSitterEnabled) {
                (0, vitest_1.it)('stops when the next non-empty line of the suffix matches', async () => {
                    (0, vitest_1.expect)((await (0, helpers_1.getInlineCompletionsInsertText)((0, helpers_1.params)((0, dedent_1.default) `
                                function myFunction() {
                                    █
                                }
                        `, [
                        (0, test_helpers_1.completion) `
                                ├function nestedFunction() {
                                    console.log('one')
                                }

                                nestedFunction()
                                }┤`,
                    ])))[0]).toMatchInlineSnapshot(`
                      "function nestedFunction() {
                          console.log('one')
                      }

                      nestedFunction()"
                    `);
                });
                (0, vitest_1.it)('stops when the next non-empty line of the suffix starts with the last completion line', async () => {
                    (0, vitest_1.expect)((await (0, helpers_1.getInlineCompletionsInsertText)((0, helpers_1.params)((0, dedent_1.default) `
                                    const controller = {
                                        set(value) {
                                            █
                                        },
                                        get() {
                                            return 1
                                        }
                                    }`, [
                        (0, test_helpers_1.completion) `
                                            ├this.value = value
                                        },
                                        whatever() ┤
                                    ┴┴┴┴`,
                    ])))[0]).toBe('this.value = value');
                });
                (0, vitest_1.it)('truncates multiline completions with inconsistent indentation', async () => {
                    (0, vitest_1.expect)((await (0, helpers_1.getInlineCompletionsInsertText)((0, helpers_1.params)((0, dedent_1.default) `
                        function it() {
                            █
                    `, [
                        (0, test_helpers_1.completion) `
                            console.log('foo')
                        console.log('oops')
                        }

                        console.log('redundant')
                        `,
                    ])))[0]).toBe((0, dedent_1.default) `
                    console.log('foo')
                console.log('oops')
                }
            `);
                });
                (0, vitest_1.it)('truncates multiline completions with many nested block statements', async () => {
                    (0, vitest_1.expect)((await (0, helpers_1.getInlineCompletionsInsertText)((0, helpers_1.params)((0, dedent_1.default) `
                        class Animal {
                            █
                        }
                    `, [
                        (0, test_helpers_1.completion) `
                                        constructor(name: string) {}

                                        bark() {
                                            const barkData = { tone: 'loud' }
                                            this.produceSound(barkData)
                                        }

                                        wasuup() {
                                            this.bark()
                                        }
                                    }

                                    redundantFunctionCall(123)
                                    `,
                    ])))[0]).toMatchInlineSnapshot(`
                  "constructor(name: string) {}

                      bark() {
                          const barkData = { tone: 'loud' }
                          this.produceSound(barkData)
                      }

                      wasuup() {
                          this.bark()
                      }"
                `);
                });
                (0, vitest_1.it)('handles missing brackets gracefully to truncate the completion correctly', async () => {
                    const requestParams = (0, helpers_1.params)('console.log(1); const █', [(0, test_helpers_1.completion) ``], {
                        *completionResponseGenerator() {
                            yield (0, test_helpers_1.completion) `
                                ├MyCoolObject = {
                                constructor() {`;
                            yield (0, test_helpers_1.completion) `
                                ├MyCoolObject = {
                                constructor() {
                                    console.log(1)

                                    if (false`;
                            yield (0, test_helpers_1.completion) `
                                ├MyCoolObject = {
                                constructor() {
                                    console.log(1)

                                    if (false) {
                                        console.log(2)
                                    }

                                    const result = {
                                        value:`;
                            yield (0, test_helpers_1.completion) `
                                ├MyCoolObject = {
                                constructor() {
                                    console.log(1)

                                    if (false) {
                                        console.log(2)
                                    }

                                    const result = {
                                        value: true
                                    }

                                    return result
                                }
                            }
                            console.log(5)┤`;
                        },
                        configuration: { autocompleteExperimentalDynamicMultilineCompletions: true },
                    });
                    const [insertText] = await (0, helpers_1.getInlineCompletionsInsertText)(requestParams);
                    (0, vitest_1.expect)(insertText).toMatchInlineSnapshot(`
                      "MyCoolObject = {
                          constructor() {
                              console.log(1)

                              if (false) {
                                  console.log(2)
                              }

                              const result = {
                                  value: true
                              }

                              return result
                          }
                      }"
                    `);
                });
            }
        });
    });
}
