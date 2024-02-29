"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const release_1 = require("./release");
(0, vitest_1.describe)('majorMinorVersion', () => {
    (0, vitest_1.it)('returns the first two components', () => {
        (0, vitest_1.expect)((0, release_1.majorMinorVersion)('0.2.1')).toEqual('0.2');
        (0, vitest_1.expect)((0, release_1.majorMinorVersion)('4.2.1')).toEqual('4.2');
        (0, vitest_1.expect)((0, release_1.majorMinorVersion)('4.3.1689391131')).toEqual('4.3');
    });
});
(0, vitest_1.describe)('releaseType', () => {
    (0, vitest_1.it)('returns stable if no dash', () => {
        (0, vitest_1.expect)((0, release_1.releaseType)('4.2.1')).toEqual('stable');
    });
    (0, vitest_1.it)('returns insiders if it is an odd minor version', () => {
        (0, vitest_1.expect)((0, release_1.releaseType)('4.3.1689391131')).toEqual('insiders');
    });
});
(0, vitest_1.describe)('releaseNotesURL', () => {
    (0, vitest_1.it)('returns GitHub release notes for stable builds', () => {
        (0, vitest_1.expect)((0, release_1.releaseNotesURL)('4.2.1')).toEqual('https://github.com/sourcegraph/cody/releases/tag/vscode-v4.2.1');
    });
    (0, vitest_1.it)('returns changelog for insiders builds', () => {
        (0, vitest_1.expect)((0, release_1.releaseNotesURL)('4.3.1689391131')).toEqual('https://github.com/sourcegraph/cody/blob/main/vscode/CHANGELOG.md');
    });
});
