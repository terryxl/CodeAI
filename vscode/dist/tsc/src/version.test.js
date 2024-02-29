"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const version_1 = require("./version");
vitest_1.vi.mock('vscode', () => ({
    extensions: {
        getExtension: vitest_1.vi.fn().mockReturnValue({ packageJSON: { version: '1.2.3' } }),
    },
}));
(0, vitest_1.describe)('version', () => {
    (0, vitest_1.it)('returns the version from the runtime extension info', () => {
        (0, vitest_1.expect)(version_1.version).toEqual('1.2.3');
    });
});
