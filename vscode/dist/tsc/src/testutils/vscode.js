"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const mocks_1 = require("./mocks");
/**
 * Apply the default VSCode mocks to the global scope.
 */
vitest_1.vi.mock('vscode', () => mocks_1.vsCodeMocks);
