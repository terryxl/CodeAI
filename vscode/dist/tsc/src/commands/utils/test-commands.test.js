"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const vscode_uri_1 = require("vscode-uri");
const test_commands_1 = require("./test-commands");
(0, vitest_1.describe)('extractTestType', () => {
    (0, vitest_1.it)('extracts "unit" from test type', () => {
        const text = 'add unit tests here';
        const expected = 'unit';
        const result = (0, test_commands_1.extractTestType)(text);
        (0, vitest_1.expect)(result).toEqual(expected);
    });
    (0, vitest_1.it)('extracts "e2e" from test type', () => {
        const text = 'missing e2e test coverage';
        const expected = 'e2e';
        const result = (0, test_commands_1.extractTestType)(text);
        (0, vitest_1.expect)(result).toEqual(expected);
    });
    (0, vitest_1.it)('extracts "integration" from test type', () => {
        const text = 'needs more integration testing';
        const expected = 'integration';
        const result = (0, test_commands_1.extractTestType)(text);
        (0, vitest_1.expect)(result).toEqual(expected);
    });
    (0, vitest_1.it)('returns empty string if no match', () => {
        const text = 'test this function';
        const expected = '';
        const result = (0, test_commands_1.extractTestType)(text);
        (0, vitest_1.expect)(result).toEqual(expected);
    });
});
(0, vitest_1.describe)('isValidTestFile', () => {
    vitest_1.it.each([
        ['/path/to/testFile.java', false],
        ['/path/to/testFile.js', false],
        ['/path/to/test_file.py', true],
        ['/path/to/test-file.js', false],
        ['/path/to/node_modules/file.js', false],
        ['/path/to/node_modules/file_test.ts', true],
        ['/path/to/file.js', false],
        // Examples from various programming languages
        ['test_example.py', true],
        ['example.test.js', true],
        ['ExampleTest.java', true],
        ['example_spec.rb', true],
        ['ExampleTest.cs', true],
        ['ExampleTest.php', true],
        ['ExampleSpec.scala', true],
        ['example_test.go', true],
        ['ExampleTest.kt', true],
        ['ExampleTests.swift', true],
        ['example.spec.ts', true],
        ['ExampleTest.pl', true],
        ['example_test.rs', true],
        ['ExampleSpec.groovy', true],
        ['example_test.cpp', true],
        ['example_test.js', true],
        ['test_example.rb', true],
        // Should not cache false positives
        ['contest.ts', false],
    ])('for filename %j it returns %j', (path, condition) => {
        (0, vitest_1.expect)((0, test_commands_1.isValidTestFile)(vscode_uri_1.URI.file(path))).toBe(condition);
    });
});
(0, vitest_1.describe)('isTestFileForOriginal', () => {
    vitest_1.it.each([
        ['/path/to/file.java', '/path/to/testFile.java', true],
        ['/path/to/test/file.js', '/path/to/testFile.js', false],
        ['/path/to/test/file.py', '/path/to/test_file.py', false],
        ['/path/to/file.py', '/path/to/test_file.py', true],
        ['/path/to/file.js', '/path/to/test-file.js', true],
        ['/path/to/node_modules/file.js', '/path/to/node_modules/file_test.js', true],
        ['/path/to/node_modules/file_test.js', '/path/to/node_modules/file.js', true],
        ['example.rb', 'example_spec.rb', true],
        ['Example.cs', 'ExampleTest.cs', true],
        ['Example.groovy', 'ExampleSpec.groovy', true],
        ['example.rb', 'test_example.rb', true],
        ['/path/test/to/file.js', '/path/to/test-file.js', false],
    ])('for file %j and test file %j it returns %j', (file, testFile, condition) => {
        (0, vitest_1.expect)((0, test_commands_1.isTestFileForOriginal)(vscode_uri_1.URI.file(file), vscode_uri_1.URI.file(testFile))).toBe(condition);
    });
});
