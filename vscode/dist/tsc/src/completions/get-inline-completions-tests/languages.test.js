"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dedent_1 = __importDefault(require("dedent"));
const vitest_1 = require("vitest");
const test_helpers_1 = require("../test-helpers");
const helpers_1 = require("./helpers");
(0, vitest_1.describe)('[getInlineCompletions] languages', () => {
    (0, vitest_1.it)('works with python', async () => {
        const requests = [];
        const items = await (0, helpers_1.getInlineCompletionsInsertText)((0, helpers_1.params)((0, dedent_1.default) `
                    for i in range(11):
                        if i % 2 == 0:
                            █
                `, [
            (0, test_helpers_1.completion) `
                            ├print(i)
                        elif i % 3 == 0:
                            print(f"Multiple of 3: {i}")
                        else:
                            print(f"ODD {i}")

                    for i in range(12):
                        print("unrelated")┤`,
        ], {
            languageId: 'python',
            onNetworkRequest(params) {
                requests.push(params);
            },
        }));
        (0, vitest_1.expect)(requests).toBeMultiLine();
        (0, vitest_1.expect)(items[0]).toMatchInlineSnapshot(`
          "print(i)
              elif i % 3 == 0:
                  print(f"Multiple of 3: {i}")
              else:
                  print(f"ODD {i}")"
        `);
    });
    (0, vitest_1.it)('works with java', async () => {
        const requests = [];
        const items = await (0, helpers_1.getInlineCompletionsInsertText)((0, helpers_1.params)((0, dedent_1.default) `
                    for (int i = 0; i < 11; i++) {
                        if (i % 2 == 0) {
                            █
                `, [
            (0, test_helpers_1.completion) `
                            ├System.out.println(i);
                        } else if (i % 3 == 0) {
                            System.out.println("Multiple of 3: " + i);
                        } else {
                            System.out.println("ODD " + i);
                        }
                    }

                    for (int i = 0; i < 12; i++) {
                        System.out.println("unrelated");
                    }┤`,
        ], {
            languageId: 'java',
            onNetworkRequest(params) {
                requests.push(params);
            },
        }));
        (0, vitest_1.expect)(requests).toBeMultiLine();
        (0, vitest_1.expect)(items[0]).toMatchInlineSnapshot(`
          "System.out.println(i);
              } else if (i % 3 == 0) {
                  System.out.println("Multiple of 3: " + i);
              } else {
                  System.out.println("ODD " + i);
              }"
        `);
    });
    // TODO: Detect `}\nelse\n{` pattern for else skip logic
    (0, vitest_1.it)('works with csharp', async () => {
        const requests = [];
        const items = await (0, helpers_1.getInlineCompletionsInsertText)((0, helpers_1.params)((0, dedent_1.default) `
                    for (int i = 0; i < 11; i++) {
                        if (i % 2 == 0)
                        {
                            █
                `, [
            (0, test_helpers_1.completion) `
                            ├Console.WriteLine(i);
                        }
                        else if (i % 3 == 0)
                        {
                            Console.WriteLine("Multiple of 3: " + i);
                        }
                        else
                        {
                            Console.WriteLine("ODD " + i);
                        }

                    }

                    for (int i = 0; i < 12; i++)
                    {
                        Console.WriteLine("unrelated");
                    }┤`,
        ], {
            languageId: 'csharp',
            onNetworkRequest(params) {
                requests.push(params);
            },
        }));
        (0, vitest_1.expect)(requests).toBeMultiLine();
        (0, vitest_1.expect)(items[0]).toMatchInlineSnapshot(`
                "Console.WriteLine(i);
                    }"
            `);
    });
    (0, vitest_1.it)('works with c++', async () => {
        const requests = [];
        const items = await (0, helpers_1.getInlineCompletionsInsertText)((0, helpers_1.params)((0, dedent_1.default) `
                    for (int i = 0; i < 11; i++) {
                        if (i % 2 == 0) {
                            █
                `, [
            (0, test_helpers_1.completion) `
                            ├std::cout << i;
                        } else if (i % 3 == 0) {
                            std::cout << "Multiple of 3: " << i;
                        } else  {
                            std::cout << "ODD " << i;
                        }
                    }

                    for (int i = 0; i < 12; i++) {
                        std::cout << "unrelated";
                    }┤`,
        ], {
            languageId: 'cpp',
            onNetworkRequest(params) {
                requests.push(params);
            },
        }));
        (0, vitest_1.expect)(requests).toBeMultiLine();
        (0, vitest_1.expect)(items[0]).toMatchInlineSnapshot(`
          "std::cout << i;
              } else if (i % 3 == 0) {
                  std::cout << "Multiple of 3: " << i;
              } else  {
                  std::cout << "ODD " << i;
              }"
        `);
    });
    (0, vitest_1.it)('works with c', async () => {
        const requests = [];
        const items = await (0, helpers_1.getInlineCompletionsInsertText)((0, helpers_1.params)((0, dedent_1.default) `
                    for (int i = 0; i < 11; i++) {
                        if (i % 2 == 0) {
                            █
                `, [
            (0, test_helpers_1.completion) `
                            ├printf("%d", i);
                        } else if (i % 3 == 0) {
                            printf("Multiple of 3: %d", i);
                        } else {
                            printf("ODD %d", i);
                        }
                    }

                    for (int i = 0; i < 12; i++) {
                        printf("unrelated");
                    }┤`,
        ], {
            languageId: 'c',
            onNetworkRequest(params) {
                requests.push(params);
            },
        }));
        (0, vitest_1.expect)(requests).toBeMultiLine();
        (0, vitest_1.expect)(items[0]).toMatchInlineSnapshot(`
          "printf("%d", i);
              } else if (i % 3 == 0) {
                  printf("Multiple of 3: %d", i);
              } else {
                  printf("ODD %d", i);
              }"
        `);
    });
    (0, vitest_1.it)('works with php', async () => {
        const requests = [];
        const items = await (0, helpers_1.getInlineCompletionsInsertText)((0, helpers_1.params)((0, dedent_1.default) `
                    for ($i = 0; $i < 11; $i++) {
                        if ($i % 2 == 0) {
                            █
                `, [
            (0, test_helpers_1.completion) `
                            ├echo $i;
                        } else if ($i % 3 == 0) {
                            echo "Multiple of 3: " . $i;
                        } else {
                            echo "ODD " . $i;
                        }
                    }

                    for ($i = 0; $i < 12; $i++) {
                        echo "unrelated";
                    }┤`,
        ], {
            languageId: 'c',
            onNetworkRequest(params) {
                requests.push(params);
            },
        }));
        (0, vitest_1.expect)(requests).toBeMultiLine();
        (0, vitest_1.expect)(items[0]).toMatchInlineSnapshot(`
          "echo $i;
              } else if ($i % 3 == 0) {
                  echo "Multiple of 3: " . $i;
              } else {
                  echo "ODD " . $i;
              }"
        `);
    });
    (0, vitest_1.it)('works with dart', async () => {
        const requests = [];
        const items = await (0, helpers_1.getInlineCompletionsInsertText)((0, helpers_1.params)((0, dedent_1.default) `
                    for (int i = 0; i < 11; i++) {
                        if (i % 2 == 0) {
                            █
                `, [
            (0, test_helpers_1.completion) `
                            ├print(i);
                        } else if (i % 3 == 0) {
                          print('Multiple of 3: $i');
                        } else {
                          print('ODD $i');
                        }
                      }

                      for (int i = 0; i < 12; i++) {
                        print('unrelated');
                      }┤`,
        ], {
            languageId: 'dart',
            onNetworkRequest(params) {
                requests.push(params);
            },
        }));
        (0, vitest_1.expect)(requests).toBeMultiLine();
        (0, vitest_1.expect)(items[0]).toMatchInlineSnapshot(`
              "print(i);
                  } else if (i % 3 == 0) {
                      print('Multiple of 3: $i');
                  } else {
                      print('ODD $i');
                  }"
            `);
    });
});
