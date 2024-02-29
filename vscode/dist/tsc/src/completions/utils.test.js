"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const utils_1 = require("./utils");
async function* generatorFromArray(array) {
    for (const item of array) {
        yield await Promise.resolve(item);
    }
}
(0, vitest_1.describe)('zipGenerators', () => {
    (0, vitest_1.it)('should zip values from multiple generators', async () => {
        const gen1 = generatorFromArray([1, 2, 3]);
        const gen2 = generatorFromArray([-1, -2, -3]);
        const gen3 = generatorFromArray([100, 101, 102]);
        const zipped = (0, utils_1.zipGenerators)([gen1, gen2, gen3]);
        (0, vitest_1.expect)(await zipped.next()).toEqual({ value: [1, -1, 100], done: false });
        (0, vitest_1.expect)(await zipped.next()).toEqual({ value: [2, -2, 101], done: false });
        (0, vitest_1.expect)(await zipped.next()).toEqual({ value: [3, -3, 102], done: false });
        (0, vitest_1.expect)(await zipped.next()).toEqual({ value: undefined, done: true });
    });
    (0, vitest_1.it)('should handle empty generators', async () => {
        const emptyGen = generatorFromArray([]);
        const gen = generatorFromArray([1, 2, 3]);
        const zipped = (0, utils_1.zipGenerators)([emptyGen, gen]);
        (0, vitest_1.expect)(await zipped.next()).toEqual({ value: [undefined, 1], done: false });
        (0, vitest_1.expect)(await zipped.next()).toEqual({ value: [undefined, 2], done: false });
        (0, vitest_1.expect)(await zipped.next()).toEqual({ value: [undefined, 3], done: false });
        (0, vitest_1.expect)(await zipped.next()).toEqual({ value: undefined, done: true });
    });
    (0, vitest_1.it)('should handle generators of different lengths', async () => {
        const gen1 = generatorFromArray([1, 2]);
        const gen2 = generatorFromArray([-1, -2, -3]);
        const zipped = (0, utils_1.zipGenerators)([gen1, gen2]);
        (0, vitest_1.expect)(await zipped.next()).toEqual({ value: [1, -1], done: false });
        (0, vitest_1.expect)(await zipped.next()).toEqual({ value: [2, -2], done: false });
        (0, vitest_1.expect)(await zipped.next()).toEqual({ value: [undefined, -3], done: false });
        (0, vitest_1.expect)(await zipped.next()).toEqual({ value: undefined, done: true });
    });
    (0, vitest_1.it)('should complete when all generators are empty', async () => {
        const gen1 = generatorFromArray([]);
        const gen2 = generatorFromArray([]);
        const zipped = (0, utils_1.zipGenerators)([gen1, gen2]);
        (0, vitest_1.expect)(await zipped.next()).toEqual({ value: undefined, done: true });
    });
});
(0, vitest_1.describe)('generatorWithTimeout', () => {
    (0, vitest_1.it)('finishes the internal generator if a consumer stops early', async () => {
        let isFinished = false;
        const gen = (async function* () {
            try {
                yield 1;
                yield 2;
                yield 3;
            }
            finally {
                isFinished = true;
            }
        })();
        const timeout = 1000;
        const controller = new AbortController();
        const timeoutGenerator = (0, utils_1.generatorWithTimeout)(gen, timeout, controller);
        const result = [];
        for await (const value of timeoutGenerator) {
            if (result.length === 2) {
                break; // Stop after consuming two values
            }
            result.push(value);
        }
        (0, vitest_1.expect)(result).to.deep.equal([1, 2]);
        (0, vitest_1.expect)(isFinished).to.be.true;
    });
});
