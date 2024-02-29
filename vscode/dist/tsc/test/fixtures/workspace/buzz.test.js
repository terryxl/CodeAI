"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const buzz_1 = require("./buzz");
const vitest_1 = require("vitest");
(0, vitest_1.describe)('fizzbuzz', () => {
    test('returns correct array', () => {
        const result = (0, buzz_1.fizzbuzz)();
        (0, vitest_1.expect)(result[0]).toBe('1');
        (0, vitest_1.expect)(result[2]).toBe('Fizz');
        (0, vitest_1.expect)(result[4]).toBe('Buzz');
        (0, vitest_1.expect)(result[14]).toBe('FizzBuzz');
    });
});
