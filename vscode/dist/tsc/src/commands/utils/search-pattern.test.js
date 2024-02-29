"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const vscode_uri_1 = require("vscode-uri");
const search_pattern_1 = require("./search-pattern");
const posix_1 = __importDefault(require("path/posix"));
(0, vitest_1.describe)('getSearchPatternForTestFiles', () => {
    (0, vitest_1.it)('returns pattern searching current directory for test files with same extension', () => {
        const file = vscode_uri_1.URI.file('/path/to/file.js');
        const pattern = (0, search_pattern_1.getSearchPatternForTestFiles)(file, true);
        (0, vitest_1.expect)(pattern).toEqual(osPath('/path/to/*{test,spec}*.js'));
    });
    (0, vitest_1.it)('returns pattern searching workspace for test files matching file name', () => {
        const file = vscode_uri_1.URI.file('/path/to/file.ts');
        const pattern = (0, search_pattern_1.getSearchPatternForTestFiles)(file, false, true);
        (0, vitest_1.expect)(pattern).toEqual(osPath('**/*{test_file,file_test,test.file,file.test,fileTest,spec_file,file_spec,spec.file,file.spec,fileSpec}.ts'));
    });
    (0, vitest_1.it)('returns pattern searching workspace for test files with same extension', () => {
        const file = vscode_uri_1.URI.file('/path/to/file.py');
        const pattern = (0, search_pattern_1.getSearchPatternForTestFiles)(file);
        (0, vitest_1.expect)(pattern).toEqual(osPath('**/*{test,spec}*.py'));
    });
    (0, vitest_1.it)('handles files with no extension', () => {
        const file = vscode_uri_1.URI.file('/path/to/file');
        const pattern = (0, search_pattern_1.getSearchPatternForTestFiles)(file);
        (0, vitest_1.expect)(pattern).toEqual(osPath('**/*{test,spec}*'));
    });
});
// Hack: update pattern to use OS path separator
const osPath = (pattern) => pattern.replace('/', posix_1.default.sep);
