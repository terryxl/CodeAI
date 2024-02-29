"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const assert = __importStar(require("assert"));
const vscode = __importStar(require("vscode"));
const history_1 = require("../../../src/completions/context/retrievers/jaccard-similarity/history");
const helpers_1 = require("../helpers");
suite('API tests', () => {
    test('Cody registers some commands', async () => {
        const commands = await vscode.commands.getCommands(true);
        const codyCommands = commands.filter(command => command.includes('cody.'));
        assert.ok(codyCommands.length);
    });
    test('History', () => {
        const h = new history_1.VSCodeDocumentHistory(() => null);
        h.addItem({
            document: {
                uri: (0, helpers_1.testFileUri)('foo.ts'),
                languageId: 'ts',
            },
        });
        h.addItem({
            document: {
                uri: (0, helpers_1.testFileUri)('bar.ts'),
                languageId: 'ts',
            },
        });
        h.addItem({
            document: {
                uri: (0, helpers_1.testFileUri)('foo.ts'),
                languageId: 'ts',
            },
        });
        assert.deepStrictEqual(h.lastN(20).map(h => h.document.uri.toString()), [(0, helpers_1.testFileUri)('foo.ts').toString(), (0, helpers_1.testFileUri)('bar.ts').toString()]);
    });
});
//# sourceMappingURL=api.test.js.map