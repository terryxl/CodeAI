"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const test_1 = require("@playwright/test");
exports.default = (0, test_1.defineConfig)({
    workers: 1,
    // Give failing tests a second chance
    retries: 2,
    testDir: 'test/e2e',
});
