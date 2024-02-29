"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const vscode_uri_1 = require("vscode-uri");
const cody_shared_1 = require("@sourcegraph/cody-shared");
(0, vitest_1.beforeAll)(() => {
    const isWin = (0, cody_shared_1.isWindows)();
    (0, cody_shared_1.setDisplayPathEnvInfo)({
        isWindows: isWin,
        workspaceFolders: [isWin ? vscode_uri_1.URI.file('C:\\') : vscode_uri_1.URI.file('/')],
    });
});
