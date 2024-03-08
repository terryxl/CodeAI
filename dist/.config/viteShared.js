"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defineProjectWithDefaults = void 0;
const path_1 = require("path");
const vite_1 = require("vite");
const config_1 = require("vitest/config");
/**
 * Default configuration for a project in a workspace.
 */
const defaultProjectConfig = {
    resolve: {
        alias: [
            // Build from TypeScript sources so we don't need to run `tsc -b` in the background
            // during dev.
            {
                find: /^(@sourcegraph\/cody-[\w-]+)$/,
                replacement: '$1/src/index.ts',
            },
        ],
    },
    css: { modules: { localsConvention: 'camelCaseOnly' } },
    test: {
        fakeTimers: {
            toFake: [...config_1.configDefaults.fakeTimers.toFake, 'performance'],
        },
    },
};
/**
 * Configuration that applies to the entire workspace.
 */
const defaultUserConfig = { logLevel: 'warn' };
function defineProjectWithDefaults(dir, config) {
    const name = (0, path_1.basename)(dir);
    if (!config.test) {
        config.test = {};
    }
    if (!config.test.name) {
        config.test.name = name;
    }
    return (0, vite_1.mergeConfig)((0, vite_1.mergeConfig)(defaultProjectConfig, defaultUserConfig), (0, config_1.defineProject)(config));
}
exports.defineProjectWithDefaults = defineProjectWithDefaults;
//# sourceMappingURL=viteShared.js.map