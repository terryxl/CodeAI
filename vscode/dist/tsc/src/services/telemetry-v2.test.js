"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const cody_shared_1 = require("@sourcegraph/cody-shared");
const telemetry_v2_1 = require("./telemetry-v2");
(0, vitest_1.describe)('splitSafeMetadata', () => {
    (0, vitest_1.it)('splits into safe and unsafe', () => {
        const parameters = {
            number: 3,
            float: 3.14,
            true: true,
            false: false,
            string: 'string',
            object: { key: 'value', safeVar: 3 },
        };
        const originalParameters = { ...parameters };
        const { metadata, privateMetadata } = (0, telemetry_v2_1.splitSafeMetadata)(parameters);
        // retains safe values in metadata
        (0, vitest_1.expect)(metadata).toStrictEqual({
            number: 3,
            float: 3.14,
            true: 1,
            false: 0,
            // shallow-extract safe value from object
            'object.safeVar': 3,
        });
        // retains arbitrary values in privateMetadata
        (0, vitest_1.expect)(privateMetadata).toStrictEqual({
            string: 'string',
            object: { key: 'value', safeVar: 3 },
        });
        // accounts for all values
        (0, vitest_1.expect)(Object.keys({ ...metadata, ...privateMetadata })).toEqual(vitest_1.expect.arrayContaining(Object.keys(originalParameters)));
        // sanity-check original parameters are not mutated
        (0, vitest_1.expect)(parameters).toStrictEqual(originalParameters);
    });
    (0, vitest_1.it)('deep safe flatten', () => {
        const parameters = {
            object: { key: 'value', safeVar: 3, deepObject: { alsoSafeVar: 4, foo: 'bar' } },
        };
        const originalParameters = { ...parameters };
        const { metadata, privateMetadata } = (0, telemetry_v2_1.splitSafeMetadata)(parameters);
        // retains safe values in metadata
        (0, vitest_1.expect)(metadata).toEqual({
            'object.safeVar': 3,
            'object.deepObject.alsoSafeVar': 4,
        });
        // retains arbitrary values in privateMetadata
        (0, vitest_1.expect)(privateMetadata).toEqual({
            object: { key: 'value', safeVar: 3, deepObject: { alsoSafeVar: 4, foo: 'bar' } },
        });
        // accounts for all values
        (0, vitest_1.expect)(Object.keys({ ...metadata, ...privateMetadata })).toEqual(vitest_1.expect.arrayContaining(Object.keys(originalParameters)));
        // sanity-check original parameters are not mutated
        (0, vitest_1.expect)(parameters).toStrictEqual(originalParameters);
    });
    (0, vitest_1.it)('arrays', () => {
        const parameters = {
            array: [
                {
                    safe: 1,
                    unsafe: 'foobar',
                },
                {
                    safe: 2,
                    unsafe: 'alsofoobar',
                },
            ],
        };
        const originalParameters = { ...parameters };
        const { metadata, privateMetadata } = (0, telemetry_v2_1.splitSafeMetadata)(parameters);
        // retains safe values in metadata
        (0, vitest_1.expect)(metadata).toEqual({
            'array.0.safe': 1,
            'array.1.safe': 2,
        });
        // retains arbitrary values in privateMetadata
        (0, vitest_1.expect)(privateMetadata).toEqual({
            array: [
                {
                    safe: 1,
                    unsafe: 'foobar',
                },
                {
                    safe: 2,
                    unsafe: 'alsofoobar',
                },
            ],
        });
        // accounts for all values
        (0, vitest_1.expect)(Object.keys({ ...metadata, ...privateMetadata })).toEqual(vitest_1.expect.arrayContaining(Object.keys(originalParameters)));
        // sanity-check original parameters are not mutated
        (0, vitest_1.expect)(parameters).toStrictEqual(originalParameters);
    });
    (0, vitest_1.it)('can be provided to TelemetryRecorder', () => {
        // This test just validates that the returned types of splitSafeMetadata
        // are accepted by telemetryRecorder.recordEvent
        const events = [];
        const telemetryRecorder = new cody_shared_1.NoOpTelemetryRecorderProvider([
            {
                processEvent: event => {
                    events.push(event);
                },
            },
        ]).getRecorder();
        const { metadata, privateMetadata } = (0, telemetry_v2_1.splitSafeMetadata)({
            number: 3,
            float: 3.14,
            true: true,
            false: false,
            string: 'string',
            object: { key: 'value', safeVar: 3 },
        });
        telemetryRecorder.recordEvent('telemetry-v2.test', 'splitSafeMetadata', {
            metadata,
            privateMetadata,
        });
        // Assert processed event
        (0, vitest_1.expect)(events).toHaveLength(1);
        (0, vitest_1.expect)(events[0]).toEqual({
            action: 'splitSafeMetadata',
            feature: 'telemetry-v2.test',
            parameters: {
                metadata: [
                    {
                        key: 'number',
                        value: 3,
                    },
                    {
                        key: 'float',
                        value: 3.14,
                    },
                    {
                        key: 'true',
                        value: 1,
                    },
                    {
                        key: 'false',
                        value: 0,
                    },
                    {
                        key: 'object.safeVar',
                        value: 3,
                    },
                ],
                privateMetadata: {
                    object: {
                        key: 'value',
                        safeVar: 3,
                    },
                    string: 'string',
                },
                version: 0,
            },
            source: {
                client: '',
            },
        });
    });
});
