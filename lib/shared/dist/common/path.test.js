import { describe, expect, test } from 'vitest';
import { URI } from 'vscode-uri';
import { pathFunctionsForURI, posixFilePaths, windowsFilePaths } from './path';
describe('pathFunctions', () => {
    describe('nonWindows', () => {
        describe('paths', () => {
            test('dirname', () => {
                expect(posixFilePaths.dirname('/a/b/c')).toBe('/a/b');
                expect(posixFilePaths.dirname('/a/b')).toBe('/a');
                expect(posixFilePaths.dirname('/a/b/')).toBe('/a');
                expect(posixFilePaths.dirname('/a')).toBe('/');
                expect(posixFilePaths.dirname('/a/')).toBe('/');
                expect(posixFilePaths.dirname('/')).toBe('/');
                expect(posixFilePaths.dirname('')).toBe('.');
                expect(posixFilePaths.dirname('a')).toBe('.');
            });
            test('basename', () => {
                expect(posixFilePaths.basename('/a/b/c')).toBe('c');
                expect(posixFilePaths.basename('/a/b')).toBe('b');
                expect(posixFilePaths.basename('/a/b/')).toBe('b');
                expect(posixFilePaths.basename('/a')).toBe('a');
                expect(posixFilePaths.basename('/a/')).toBe('a');
                expect(posixFilePaths.basename('/')).toBe('');
                expect(posixFilePaths.basename('')).toBe('');
                expect(posixFilePaths.basename('a')).toBe('a');
            });
            test('relative', () => {
                expect(posixFilePaths.relative('/a/b', '/a/b/c')).toBe('c');
                expect(posixFilePaths.relative('/a/b/', '/a/b/c')).toBe('c');
                expect(posixFilePaths.relative('/a', '/a/b/c')).toBe('b/c');
                expect(posixFilePaths.relative('/a', '/a')).toBe('');
                expect(posixFilePaths.relative('/a/', '/a')).toBe('');
                expect(posixFilePaths.relative('/a', '/a/')).toBe('');
                expect(posixFilePaths.relative('/a/', '/a/')).toBe('');
                expect(posixFilePaths.relative('/', '/a/b/c')).toBe('a/b/c');
                expect(posixFilePaths.relative('/a/b', '/a')).toBe('..');
                expect(posixFilePaths.relative('/a/b', '/a/')).toBe('..');
                expect(posixFilePaths.relative('/a/b/', '/a/')).toBe('..');
                expect(posixFilePaths.relative('/a/b', '/a/')).toBe('..');
                expect(posixFilePaths.relative('/a/b/c/d', '/a/b/c')).toBe('..');
                expect(posixFilePaths.relative('/a/b/c/d', '/a')).toBe('../../..');
                expect(posixFilePaths.relative('a', '/a')).toBe('/a');
                expect(posixFilePaths.relative('a/b', '/a')).toBe('/a');
                expect(posixFilePaths.relative('a', '/c')).toBe('/c');
                expect(posixFilePaths.relative('a/b', '/c')).toBe('/c');
            });
        });
        describe('uris', () => {
            const posixFileUris = pathFunctionsForURI(URI.file('/'), false);
            test('dirname', () => {
                expect(posixFileUris.dirname('file:///a/b/c')).toBe('file:///a/b');
                expect(posixFileUris.dirname('file:///a/b')).toBe('file:///a');
                expect(posixFileUris.dirname('file:///a/b/')).toBe('file:///a');
            });
            test('basename', () => {
                expect(posixFileUris.basename('file:///a/b/c')).toBe('c');
                expect(posixFileUris.basename('file:///a/b')).toBe('b');
                expect(posixFileUris.basename('file:///a/b/')).toBe('b');
                expect(posixFileUris.basename('file:///a')).toBe('a');
                expect(posixFileUris.basename('file:///a/')).toBe('a');
                expect(posixFileUris.basename('file:///')).toBe('');
            });
            test('relative', () => {
                expect(posixFileUris.relative('file:///a/b', 'file:///a/b/c')).toBe('c');
                expect(posixFileUris.relative('file:///a/b/', 'file:///a/b/c')).toBe('c');
                expect(posixFileUris.relative('file:///a', 'file:///a/b/c')).toBe('b/c');
                expect(posixFileUris.relative('file:///a', 'file:///a')).toBe('');
                expect(posixFileUris.relative('file:///a/', 'file:///a')).toBe('');
                expect(posixFileUris.relative('file:///a', 'file:///a/')).toBe('');
                expect(posixFileUris.relative('file:///a/', 'file:///a/')).toBe('');
                expect(posixFileUris.relative('file:///', 'file:///a/b/c')).toBe('a/b/c');
                expect(posixFileUris.relative('file:///a/b', 'file:///a')).toBe('..');
                expect(posixFileUris.relative('file:///a/b', 'file:///a/')).toBe('..');
                expect(posixFileUris.relative('file:///a/b/', 'file:///a/')).toBe('..');
                expect(posixFileUris.relative('file:///a/b', 'file:///a/')).toBe('..');
                expect(posixFileUris.relative('file:///a/b/c/d', 'file:///a/b/c')).toBe('..');
                expect(posixFileUris.relative('file:///a/b/c/d', 'file:///a')).toBe('../../..');
            });
        });
    });
    describe('windows', () => {
        describe('paths', () => {
            test('dirname', () => {
                expect(windowsFilePaths.dirname('C:\\a\\b\\c')).toBe('C:\\a\\b');
                expect(windowsFilePaths.dirname('C:\\a\\b')).toBe('C:\\a');
                expect(windowsFilePaths.dirname('C:\\a')).toBe('C:\\');
                expect(windowsFilePaths.dirname('C:\\a\\')).toBe('C:\\');
                expect(windowsFilePaths.dirname('C:\\')).toBe('C:\\');
                expect(windowsFilePaths.dirname('C:')).toBe('C:');
                expect(windowsFilePaths.dirname('a\\b')).toBe('a');
                expect(windowsFilePaths.dirname('\\a\\b')).toBe('\\a');
                expect(windowsFilePaths.dirname('a')).toBe('.');
                expect(windowsFilePaths.dirname('\\a')).toBe('\\');
            });
            test('basename', () => {
                expect(windowsFilePaths.basename('C:\\a\\b\\c')).toBe('c');
                expect(windowsFilePaths.basename('C:\\a\\b')).toBe('b');
                expect(windowsFilePaths.basename('C:\\a')).toBe('a');
                expect(windowsFilePaths.basename('C:\\a\\')).toBe('a');
                expect(windowsFilePaths.basename('C:\\')).toBe('');
                expect(windowsFilePaths.basename('C:')).toBe('');
                expect(windowsFilePaths.basename('')).toBe('');
                expect(windowsFilePaths.basename('a\\b')).toBe('b');
                expect(windowsFilePaths.basename('\\a\\b')).toBe('b');
                expect(windowsFilePaths.basename('a')).toBe('a');
                expect(windowsFilePaths.basename('\\a')).toBe('a');
            });
            test('relative', () => {
                expect(windowsFilePaths.relative('c:\\a\\b', 'c:\\a\\b\\c')).toBe('c');
                expect(windowsFilePaths.relative('c:\\a\\b\\', 'c:\\a\\b\\c')).toBe('c');
                expect(windowsFilePaths.relative('c:\\a', 'c:\\a\\b\\c')).toBe('b\\c');
                expect(windowsFilePaths.relative('c:\\a', 'c:\\a')).toBe('');
                expect(windowsFilePaths.relative('c:\\a\\', 'c:\\a')).toBe('');
                expect(windowsFilePaths.relative('c:\\a', 'c:\\a\\')).toBe('');
                expect(windowsFilePaths.relative('c:\\a\\', 'c:\\a\\')).toBe('');
                expect(windowsFilePaths.relative('c:\\', 'c:\\a\\b\\c')).toBe('a\\b\\c');
                expect(windowsFilePaths.relative('c:\\a\\b', 'c:\\a')).toBe('..');
                expect(windowsFilePaths.relative('c:\\a\\b', 'c:\\a\\')).toBe('..');
                expect(windowsFilePaths.relative('c:\\a\\b\\', 'c:\\a\\')).toBe('..');
                expect(windowsFilePaths.relative('c:\\a\\b', 'c:\\a\\')).toBe('..');
                expect(windowsFilePaths.relative('c:\\a\\b\\c\\d', 'c:\\a\\b\\c')).toBe('..');
                expect(windowsFilePaths.relative('c:\\a\\b\\c\\d', 'c:\\a')).toBe('..\\..\\..');
            });
        });
        describe('uris', () => {
            const windowsFileUris = pathFunctionsForURI(URI.file('file:///c:/'), true);
            test('dirname', () => {
                expect(windowsFileUris.dirname('file:///C:/a/b/c')).toBe('file:///C:/a/b');
                expect(windowsFileUris.dirname('file:///C:/a/b')).toBe('file:///C:/a');
                expect(windowsFileUris.dirname('file:///C:/a')).toBe('file:///C:');
                expect(windowsFileUris.dirname('file:///C:/a/')).toBe('file:///C:');
            });
            test('basename', () => {
                expect(windowsFileUris.basename('file:///C:/a/b/c')).toBe('c');
                expect(windowsFileUris.basename('file:///C:/a/b')).toBe('b');
                expect(windowsFileUris.basename('file:///C:/a')).toBe('a');
                expect(windowsFileUris.basename('file:///C:/a/')).toBe('a');
            });
            test('relative', () => {
                // These ones have differing case (drive letter).
                //
                // Relative paths between two URIs on Windows still use backslashes, because the
                // result is a relative path, not a URI.
                expect(windowsFileUris.relative('file:///C:/a/b', 'file:///c:/a/b/c')).toBe('c');
                expect(windowsFileUris.relative('file:///C:/a/b/', 'file:///c:/a/b/c')).toBe('c');
                expect(windowsFileUris.relative('file:///C:/a', 'file:///c:/a/b/c')).toBe('b\\c');
                expect(windowsFileUris.relative('file:///C:/a', 'file:///c:/a')).toBe('');
                expect(windowsFileUris.relative('file:///C:/a/', 'file:///c:/a')).toBe('');
                expect(windowsFileUris.relative('file:///C:/a', 'file:///c:/a/')).toBe('');
                expect(windowsFileUris.relative('file:///C:/a/', 'file:///c:/a/')).toBe('');
                expect(windowsFileUris.relative('file:///C:/', 'file:///c:/a/b/c')).toBe('a\\b\\c');
                expect(windowsFileUris.relative('file:///C:/a/b', 'file:///c:/a')).toBe('..');
                expect(windowsFileUris.relative('file:///C:/a/b', 'file:///c:/a/')).toBe('..');
                expect(windowsFileUris.relative('file:///C:/a/b/', 'file:///c:/a/')).toBe('..');
                expect(windowsFileUris.relative('file:///C:/a/b', 'file:///c:/a/')).toBe('..');
                expect(windowsFileUris.relative('file:///C:/a/b/c/d', 'file:///c:/a/b/c')).toBe('..');
                expect(windowsFileUris.relative('file:///C:/a/b/c/d', 'file:///c:/a')).toBe('..\\..\\..');
            });
        });
    });
    test('extname', () => {
        // extname does not differ in behavior on Windows vs. non-Windows, so we don't need to test
        // it for both platforms.
        const extname = pathFunctionsForURI(URI.file(''), false).extname;
        expect(extname('/a/b/c.ts')).toBe('.ts');
        expect(extname('/a/b.XX')).toBe('.XX');
        expect(extname('/a/.a')).toBe('');
        expect(extname('/a/.index.md')).toBe('.md');
        expect(extname('c.test.ts')).toBe('.ts');
        expect(extname('a')).toBe('');
        expect(extname('a.')).toBe('.');
    });
});
//# sourceMappingURL=path.test.js.map