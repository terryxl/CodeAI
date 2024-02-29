"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const mocks_1 = require("./mocks");
(0, vitest_1.describe)('VS Code Mocks', () => {
    (0, vitest_1.describe)('Range', () => {
        (0, vitest_1.it)('constructor(Position,Position)', () => {
            const start = new mocks_1.Position(1, 2);
            const end = new mocks_1.Position(2, 3);
            const selection = new mocks_1.Range(start, end);
            (0, vitest_1.expect)(selection.start).toStrictEqual(start);
            (0, vitest_1.expect)(selection.end).toStrictEqual(end);
        });
        (0, vitest_1.it)('constructor(number,number)', () => {
            const selection = new mocks_1.Selection(1, 2, 3, 4);
            (0, vitest_1.expect)(selection.start.line).toStrictEqual(1);
            (0, vitest_1.expect)(selection.start.character).toStrictEqual(2);
            (0, vitest_1.expect)(selection.end.line).toStrictEqual(3);
            (0, vitest_1.expect)(selection.end.character).toStrictEqual(4);
        });
    });
    (0, vitest_1.describe)('Selection', () => {
        (0, vitest_1.it)('constructor(Position,Position)', () => {
            const anchor = new mocks_1.Position(1, 2);
            const active = new mocks_1.Position(2, 3);
            const selection = new mocks_1.Selection(anchor, active);
            (0, vitest_1.expect)(selection.anchor).toStrictEqual(anchor);
            (0, vitest_1.expect)(selection.start).toStrictEqual(selection.anchor);
            (0, vitest_1.expect)(selection.active).toStrictEqual(active);
            (0, vitest_1.expect)(selection.end).toStrictEqual(selection.active);
        });
        (0, vitest_1.it)('constructor(number,number)', () => {
            const selection = new mocks_1.Selection(1, 2, 3, 4);
            (0, vitest_1.expect)(selection.start.line).toStrictEqual(1);
            (0, vitest_1.expect)(selection.start.character).toStrictEqual(2);
            (0, vitest_1.expect)(selection.end.line).toStrictEqual(3);
            (0, vitest_1.expect)(selection.end.character).toStrictEqual(4);
        });
    });
});
