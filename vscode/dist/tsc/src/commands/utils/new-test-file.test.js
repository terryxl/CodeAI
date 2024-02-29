"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const vscode_uri_1 = require("vscode-uri");
const new_test_file_1 = require("./new-test-file");
(0, vitest_1.describe)('createDefaultTestFile', () => {
    vitest_1.it.each([
        ['/path/to/file.java', '/path/to/fileTest.java'],
        ['/path/to/file.js', '/path/to/file.test.js'],
        ['/path/to/file.go', '/path/to/file_test.go'],
        ['/path/to/test_file.py', '/path/to/test_file.py'],
        ['/path/to/test-file.js', '/path/to/test-file.test.js'],
        ['/path/to/node_modules/file.js', '/path/to/node_modules/file.test.js'],
        ['/path/to/node_modules/file_test.ts', '/path/to/node_modules/file_test.ts'],
        ['/path/to/fileTest.js', '/path/to/fileTest.js'],
        ['test_example.py', 'test_example.py'],
        ['example.cpp', 'exampleTest.cpp'],
        ['example.test.js', 'example.test.js'],
        ['Example.java', 'ExampleTest.java'],
        ['ExampleTest.java', 'ExampleTest.java'],
        ['example.rb', 'example_spec.rb'],
        ['Example.cs', 'ExampleTest.cs'],
        ['ExampleTest.php', 'ExampleTest.php'],
        ['ExampleSpec.scala', 'ExampleSpec.scala'],
        ['file.rb', 'file_spec.rb'],
        ['contest.ts', 'contest.test.ts'],
    ])('for file %j it returns %j', (file, test) => {
        (0, vitest_1.expect)((0, new_test_file_1.createDefaultTestFile)(vscode_uri_1.URI.file(file)).toString()).toBe(vscode_uri_1.URI.file(test).toString());
    });
});
(0, vitest_1.describe)('convertFileUriToTestFileUri', () => {
    (0, vitest_1.it)('should return the current file uri if it is already a test file', () => {
        (0, vitest_1.expect)((0, new_test_file_1.convertFileUriToTestFileUri)(vscode_uri_1.URI.file('/path/to/testFile.test.ts')).toString()).toBe(vscode_uri_1.URI.file('/path/to/testFile.test.ts').toString());
    });
    (0, vitest_1.it)('should return the current file uri if it is already a spec file', () => {
        (0, vitest_1.expect)((0, new_test_file_1.convertFileUriToTestFileUri)(vscode_uri_1.URI.file('/path/to/testFile.spec.rb')).toString()).toBe(vscode_uri_1.URI.file('/path/to/testFile.spec.rb').toString());
    });
    (0, vitest_1.it)('should generate a test file uri from a non-test file uri', () => {
        (0, vitest_1.expect)((0, new_test_file_1.convertFileUriToTestFileUri)(vscode_uri_1.URI.file('/path/to/file.ts'), vscode_uri_1.URI.file('/path/to/testFile.ts')).toString()).toBe(vscode_uri_1.URI.file('/path/to/file.test.ts').toString());
    });
    (0, vitest_1.it)('should generate the default spec file uri from a non-test file uri for ruby', () => {
        (0, vitest_1.expect)((0, new_test_file_1.convertFileUriToTestFileUri)(vscode_uri_1.URI.file('/path/to/file.rb'), vscode_uri_1.URI.file('/path/to/testFile.ts')).toString()).toBe(vscode_uri_1.URI.file('/path/to/file_spec.rb').toString());
    });
    (0, vitest_1.it)('should follow an existing test file uri', () => {
        (0, vitest_1.expect)((0, new_test_file_1.convertFileUriToTestFileUri)(vscode_uri_1.URI.file('/path/to/file.ts'), vscode_uri_1.URI.file('/path/to/existingTestFile.test.ts')).toString()).toBe(vscode_uri_1.URI.file('/path/to/file.test.ts').toString());
    });
    (0, vitest_1.it)('should respect test file with different naming conventions', () => {
        (0, vitest_1.expect)((0, new_test_file_1.convertFileUriToTestFileUri)(vscode_uri_1.URI.file('/path/to/file.ts'), vscode_uri_1.URI.file('/path/to/testExistingFile.test.ts')).toString()).toBe(vscode_uri_1.URI.file('/path/to/file.test.ts').toString());
    });
    (0, vitest_1.it)('should handle a non-alphanumeric character at the test character index', () => {
        (0, vitest_1.expect)((0, new_test_file_1.convertFileUriToTestFileUri)(vscode_uri_1.URI.file('/path/to/file.ts'), vscode_uri_1.URI.file('/path/to/test-ExistingFile.test.ts')).toString()).toBe(vscode_uri_1.URI.file('/path/to/file.test.ts').toString());
    });
    (0, vitest_1.it)('should generate a test file uri for a non-test file uri in python', () => {
        (0, vitest_1.expect)((0, new_test_file_1.convertFileUriToTestFileUri)(vscode_uri_1.URI.file('/path/to/file.py'), vscode_uri_1.URI.file('/path/to/testFile_test.py')).toString()).toBe(vscode_uri_1.URI.file('/path/to/file_test.py').toString());
    });
    (0, vitest_1.it)('should generate a test file uri for a non-test file uri in python when no existing test path provided', () => {
        (0, vitest_1.expect)((0, new_test_file_1.convertFileUriToTestFileUri)(vscode_uri_1.URI.file('/path/to/test-file.py')).toString()).toBe(vscode_uri_1.URI.file('/path/to/test-file_test.py').toString());
    });
    (0, vitest_1.it)('should generate the default spec file uri for ruby when no existing test files is found', () => {
        (0, vitest_1.expect)((0, new_test_file_1.convertFileUriToTestFileUri)(vscode_uri_1.URI.file('/path/to/file.rb'), undefined).toString()).toBe(vscode_uri_1.URI.file('/path/to/file_spec.rb').toString());
    });
    (0, vitest_1.it)('should generate the corrent test file uri for window files', () => {
        (0, vitest_1.expect)((0, new_test_file_1.convertFileUriToTestFileUri)(vscode_uri_1.URI.file('\\path\\to\\file.ts'), vscode_uri_1.URI.file('\\path\\to\\testFile.test.ts')).toString()).toBe(vscode_uri_1.URI.file('\\path\\to\\file.test.ts').toString());
    });
    (0, vitest_1.it)('should follow an existing test file uri format to generate new test file uri on windows', () => {
        (0, vitest_1.expect)((0, new_test_file_1.convertFileUriToTestFileUri)(vscode_uri_1.URI.file('\\server\\c$\\folder\\current-file.go'), vscode_uri_1.URI.file('\\path\\to\\file_test.go')).toString()).toBe(vscode_uri_1.URI.file('\\server\\c$\\folder\\current-file_test.go').toString());
    });
});
