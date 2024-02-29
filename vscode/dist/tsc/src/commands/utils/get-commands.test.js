"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const get_commands_1 = require("./get-commands");
const types_1 = require("@sourcegraph/cody-shared/src/commands/types");
(0, vitest_1.describe)('buildCodyCommandMap', () => {
    (0, vitest_1.it)('builds a command map from json file', () => {
        const file = {
            hello: {
                description: 'Say Hello World',
                type: 'workspace',
                prompt: 'Hello world',
            },
            bye: {
                description: 'Say Good-bye',
                type: 'user',
                key: 'bye',
                prompt: 'Bye!',
            },
            missing: {
                description: 'Missing prompt',
                type: 'user',
            },
        };
        // Turn file into Record<string, unknown>
        const commandMap = (0, get_commands_1.buildCodyCommandMap)(types_1.CustomCommandType.Workspace, JSON.stringify(file));
        (0, vitest_1.expect)(commandMap.size).toBe(2);
        (0, vitest_1.expect)(commandMap.get('hello')).toStrictEqual({
            description: 'Say Hello World',
            type: 'workspace',
            key: 'hello',
            prompt: 'Hello world',
            mode: 'ask',
        });
        // No longer support slash commands
        (0, vitest_1.expect)(commandMap.get('/bye')?.type).toBe(undefined);
        // Command type set up by user should be replaced on build
        (0, vitest_1.expect)(commandMap.get('bye')?.type).toBe('workspace');
        // the /missing command will not be available due to the missing prompt
        // but it shouldn't break the map building process.
        (0, vitest_1.expect)(commandMap.get('/missing')?.type).toBe(undefined);
    });
    (0, vitest_1.it)('sets edit mode for edit commands correctly', () => {
        const file = {
            hello: {
                key: 'hello',
                prompt: 'Add hello world',
            },
            bye: {
                key: 'bye',
                prompt: 'Say good-bye',
            },
        };
        const commandMap = (0, get_commands_1.buildCodyCommandMap)(types_1.CustomCommandType.User, JSON.stringify(file));
        // No longer support slash commands
        (0, vitest_1.expect)(commandMap.get('/hello')?.mode).toBe(undefined);
        (0, vitest_1.expect)(commandMap.get('hello')?.mode).toBe('ask');
        (0, vitest_1.expect)(commandMap.get('hello')?.type).toBe('user');
        // All slash commands should be prefixed with '/'
        (0, vitest_1.expect)(commandMap.get('bye')?.key).toBe('bye');
        (0, vitest_1.expect)(commandMap.get('hello')?.key).toBe('hello');
    });
});
