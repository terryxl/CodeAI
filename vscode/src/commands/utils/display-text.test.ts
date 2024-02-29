import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import * as vscode from 'vscode'
import { URI } from 'vscode-uri'

import { setDisplayPathEnvInfo, type DisplayPathEnvInfo } from '@sourcegraph/cody-shared'

import { replaceFileNameWithMarkdownLink } from './display-text'

describe('replaceFileNameWithMarkdownLink', () => {
    // Mock a `displayPath` function that always uses forward slashes (even on Windows).
    let orig: DisplayPathEnvInfo | null
    beforeEach(() => {
        orig = setDisplayPathEnvInfo({ isWindows: false, workspaceFolders: [URI.file('/')] })
    })
    afterEach(() => {
        setDisplayPathEnvInfo(orig)
    })

    it('replaces file name with markdown link', () => {
        expect(
            replaceFileNameWithMarkdownLink('Hello @path/to/test.js', URI.file('/path/to/test.js'))
        ).toEqual(
            'Hello [_@path/to/test.js_](command:_cody.vscode.open?%5B%7B%22%24mid%22%3A1%2C%22path%22%3A%22%2Fpath%2Fto%2Ftest.js%22%2C%22scheme%22%3A%22file%22%7D%2C%7B%22preserveFocus%22%3Atrue%2C%22background%22%3Atrue%2C%22preview%22%3Atrue%2C%22viewColumn%22%3A-2%7D%5D)'
        )
    })

    it('replaces file name with range with markdown link', () => {
        expect(
            replaceFileNameWithMarkdownLink(
                'What is @foo.ts:2-2?',
                URI.file('/foo.ts'),
                new vscode.Range(2, 0, 2, 0)
            )
        ).toEqual(
            'What is [_@foo.ts:2-2_](command:_cody.vscode.open?%5B%7B%22%24mid%22%3A1%2C%22path%22%3A%22%2Ffoo.ts%22%2C%22scheme%22%3A%22file%22%7D%2C%7B%22selection%22%3A%7B%22start%22%3A%7B%22line%22%3A2%2C%22character%22%3A0%7D%2C%22end%22%3A%7B%22line%22%3A2%2C%22character%22%3A0%7D%7D%2C%22preserveFocus%22%3Atrue%2C%22background%22%3Atrue%2C%22preview%22%3Atrue%2C%22viewColumn%22%3A-2%7D%5D)?'
        )
    })

    it('replaces file name with symbol with markdown link', () => {
        expect(
            replaceFileNameWithMarkdownLink(
                'What is @e2e/cody.ts:2-2#codySymbol?',
                URI.file('/e2e/cody.ts'),
                new vscode.Range(2, 0, 2, 0),
                'codySymbol'
            )
        ).toEqual(
            'What is [_@e2e/cody.ts:2-2#codySymbol_](command:_cody.vscode.open?%5B%7B%22%24mid%22%3A1%2C%22path%22%3A%22%2Fe2e%2Fcody.ts%22%2C%22scheme%22%3A%22file%22%7D%2C%7B%22selection%22%3A%7B%22start%22%3A%7B%22line%22%3A2%2C%22character%22%3A0%7D%2C%22end%22%3A%7B%22line%22%3A2%2C%22character%22%3A0%7D%7D%2C%22preserveFocus%22%3Atrue%2C%22background%22%3Atrue%2C%22preview%22%3Atrue%2C%22viewColumn%22%3A-2%7D%5D)?'
        )
    })

    it('respects spaces in file name', () => {
        expect(replaceFileNameWithMarkdownLink('Loaded @my file.js', URI.file('/my file.js'))).toEqual(
            'Loaded [_@my file.js_](command:_cody.vscode.open?%5B%7B%22%24mid%22%3A1%2C%22path%22%3A%22%2Fmy%20file.js%22%2C%22scheme%22%3A%22file%22%7D%2C%7B%22preserveFocus%22%3Atrue%2C%22background%22%3Atrue%2C%22preview%22%3Atrue%2C%22viewColumn%22%3A-2%7D%5D)'
        )
    })

    describe('OS-native path separators', () => {
        /** Mimics the behavior of {@link URI.file} on Windows, regardless of the current platform. */
        function windowsFileURI(fsPath: string): URI {
            return URI.file(fsPath.replaceAll('\\', '/'))
        }

        // Mock a `displayPath` function that uses backslashes and make sure it's used everywhere.
        let orig: any
        beforeEach(() => {
            orig = setDisplayPathEnvInfo({ isWindows: true, workspaceFolders: [windowsFileURI('C:\\')] })
        })
        afterEach(() => {
            setDisplayPathEnvInfo(orig)
        })

        it('uses OS-native path separator', () => {
            expect(
                replaceFileNameWithMarkdownLink('Loaded @a\\b.js', windowsFileURI('C:\\a\\b.js'))
            ).toEqual(
                'Loaded [_@a\\b.js_](command:_cody.vscode.open?%5B%7B%22%24mid%22%3A1%2C%22path%22%3A%22%2FC%3A%2Fa%2Fb.js%22%2C%22scheme%22%3A%22file%22%7D%2C%7B%22preserveFocus%22%3Atrue%2C%22background%22%3Atrue%2C%22preview%22%3Atrue%2C%22viewColumn%22%3A-2%7D%5D)'
            )
        })
    })

    it('returns original text if no match', () => {
        expect(replaceFileNameWithMarkdownLink('No file name', URI.file('/test.js'))).toEqual(
            'No file name'
        )
    })

    it('handles special characters in path', () => {
        expect(
            replaceFileNameWithMarkdownLink(
                'Loaded @path/with/@#special$chars.js',
                URI.file('/path/with/@#special$chars.js')
            )
        ).toEqual(
            'Loaded [_@path/with/@#special$chars.js_](command:_cody.vscode.open?%5B%7B%22%24mid%22%3A1%2C%22path%22%3A%22%2Fpath%2Fwith%2F%40%23special%24chars.js%22%2C%22scheme%22%3A%22file%22%7D%2C%7B%22preserveFocus%22%3Atrue%2C%22background%22%3Atrue%2C%22preview%22%3Atrue%2C%22viewColumn%22%3A-2%7D%5D)'
        )
    })

    it('handles line numbers', () => {
        expect(
            replaceFileNameWithMarkdownLink(
                'Error in @test.js:2-2',
                URI.file('/test.js'),
                new vscode.Range(2, 0, 2, 0)
            )
        ).toEqual(
            'Error in [_@test.js:2-2_](command:_cody.vscode.open?%5B%7B%22%24mid%22%3A1%2C%22path%22%3A%22%2Ftest.js%22%2C%22scheme%22%3A%22file%22%7D%2C%7B%22selection%22%3A%7B%22start%22%3A%7B%22line%22%3A2%2C%22character%22%3A0%7D%2C%22end%22%3A%7B%22line%22%3A2%2C%22character%22%3A0%7D%7D%2C%22preserveFocus%22%3Atrue%2C%22background%22%3Atrue%2C%22preview%22%3Atrue%2C%22viewColumn%22%3A-2%7D%5D)'
        )
    })

    it('handles non alphanumeric characters follows the file name in input', () => {
        expect(
            replaceFileNameWithMarkdownLink(
                'What is @test.js:2-2?',
                URI.file('/test.js'),
                new vscode.Range(2, 0, 2, 0)
            )
        ).toEqual(
            'What is [_@test.js:2-2_](command:_cody.vscode.open?%5B%7B%22%24mid%22%3A1%2C%22path%22%3A%22%2Ftest.js%22%2C%22scheme%22%3A%22file%22%7D%2C%7B%22selection%22%3A%7B%22start%22%3A%7B%22line%22%3A2%2C%22character%22%3A0%7D%2C%22end%22%3A%7B%22line%22%3A2%2C%22character%22%3A0%7D%7D%2C%22preserveFocus%22%3Atrue%2C%22background%22%3Atrue%2C%22preview%22%3Atrue%2C%22viewColumn%22%3A-2%7D%5D)?'
        )
    })

    it('handles edge case where start line at 0 - exclude start line in markdown link', () => {
        expect(
            replaceFileNameWithMarkdownLink(
                'Error in @test.js',
                URI.file('/test.js'),
                new vscode.Range(0, 0, 0, 0)
            )
        ).toEqual(
            'Error in [_@test.js_](command:_cody.vscode.open?%5B%7B%22%24mid%22%3A1%2C%22path%22%3A%22%2Ftest.js%22%2C%22scheme%22%3A%22file%22%7D%2C%7B%22selection%22%3A%7B%22start%22%3A%7B%22line%22%3A0%2C%22character%22%3A0%7D%2C%22end%22%3A%7B%22line%22%3A0%2C%22character%22%3A0%7D%7D%2C%22preserveFocus%22%3Atrue%2C%22background%22%3Atrue%2C%22preview%22%3Atrue%2C%22viewColumn%22%3A-2%7D%5D)'
        )
    })

    it('handles names that showed up more than once', () => {
        expect(
            replaceFileNameWithMarkdownLink(
                'Compare and explain @foo.js:2-2 and @bar.js. What does @foo.js:2-2 do?',
                URI.file('/foo.js'),
                new vscode.Range(2, 0, 2, 0)
            )
        ).toEqual(
            'Compare and explain [_@foo.js:2-2_](command:_cody.vscode.open?%5B%7B%22%24mid%22%3A1%2C%22path%22%3A%22%2Ffoo.js%22%2C%22scheme%22%3A%22file%22%7D%2C%7B%22selection%22%3A%7B%22start%22%3A%7B%22line%22%3A2%2C%22character%22%3A0%7D%2C%22end%22%3A%7B%22line%22%3A2%2C%22character%22%3A0%7D%7D%2C%22preserveFocus%22%3Atrue%2C%22background%22%3Atrue%2C%22preview%22%3Atrue%2C%22viewColumn%22%3A-2%7D%5D) and @bar.js. What does [_@foo.js:2-2_](command:_cody.vscode.open?%5B%7B%22%24mid%22%3A1%2C%22path%22%3A%22%2Ffoo.js%22%2C%22scheme%22%3A%22file%22%7D%2C%7B%22selection%22%3A%7B%22start%22%3A%7B%22line%22%3A2%2C%22character%22%3A0%7D%2C%22end%22%3A%7B%22line%22%3A2%2C%22character%22%3A0%7D%7D%2C%22preserveFocus%22%3Atrue%2C%22background%22%3Atrue%2C%22preview%22%3Atrue%2C%22viewColumn%22%3A-2%7D%5D) do?'
        )
    })

    it('ignores repeated file names that are followed by another character', () => {
        expect(
            replaceFileNameWithMarkdownLink(
                'Compare and explain @foo.js:2-2 and @bar.js. What does @foo.js:2-2#FooBar() do?',
                URI.file('/foo.js'),
                new vscode.Range(2, 0, 2, 0)
            )
        ).toEqual(
            'Compare and explain [_@foo.js:2-2_](command:_cody.vscode.open?%5B%7B%22%24mid%22%3A1%2C%22path%22%3A%22%2Ffoo.js%22%2C%22scheme%22%3A%22file%22%7D%2C%7B%22selection%22%3A%7B%22start%22%3A%7B%22line%22%3A2%2C%22character%22%3A0%7D%2C%22end%22%3A%7B%22line%22%3A2%2C%22character%22%3A0%7D%7D%2C%22preserveFocus%22%3Atrue%2C%22background%22%3Atrue%2C%22preview%22%3Atrue%2C%22viewColumn%22%3A-2%7D%5D) and @bar.js. What does @foo.js:2-2#FooBar() do?'
        )
    })

    it('handles file names with line number and symbol name', () => {
        const text = '@vscode/src/logged-rerank.ts:7-23#getRerankWithLog() what does this do'

        const result = replaceFileNameWithMarkdownLink(
            text,
            URI.file('/vscode/src/logged-rerank.ts'),
            new vscode.Range(7, 0, 23, 0),
            'getRerankWithLog()'
        )

        expect(result).toEqual(
            '[_@vscode/src/logged-rerank.ts:7-23#getRerankWithLog()_](command:_cody.vscode.open?%5B%7B%22%24mid%22%3A1%2C%22path%22%3A%22%2Fvscode%2Fsrc%2Flogged-rerank.ts%22%2C%22scheme%22%3A%22file%22%7D%2C%7B%22selection%22%3A%7B%22start%22%3A%7B%22line%22%3A7%2C%22character%22%3A0%7D%2C%22end%22%3A%7B%22line%22%3A23%2C%22character%22%3A0%7D%7D%2C%22preserveFocus%22%3Atrue%2C%22background%22%3Atrue%2C%22preview%22%3Atrue%2C%22viewColumn%22%3A-2%7D%5D) what does this do'
        )
    })
})
