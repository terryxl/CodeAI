"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const stream_1 = require("stream");
const vitest_1 = require("vitest");
const client_1 = require("./client");
(0, vitest_1.describe)('createSSEIterator', () => {
    (0, vitest_1.it)('yields SSE messages from the iterator', async () => {
        async function* createIterator() {
            yield Buffer.from('event: completion\ndata: {"foo":"bar"}\n\n');
            yield Buffer.from('event: completion\ndata: {"baz":"qux"}\n\n');
        }
        const messages = [];
        const iterator = (0, client_1.createSSEIterator)(stream_1.Readable.from(createIterator()));
        for await (const message of iterator) {
            messages.push(message);
        }
        (0, vitest_1.expect)(messages).toEqual([
            { event: 'completion', data: '{"foo":"bar"}' },
            { event: 'completion', data: '{"baz":"qux"}' },
        ]);
    });
    (0, vitest_1.it)('buffers partial responses', async () => {
        async function* createIterator() {
            yield Buffer.from('event: comple');
            yield Buffer.from('tion\ndata: {"foo":"bar"}\n');
            yield Buffer.from('\nevent: comple');
            yield Buffer.from('tion\ndata: {"baz":"qux"}\n\n');
        }
        const messages = [];
        const iterator = (0, client_1.createSSEIterator)(stream_1.Readable.from(createIterator()));
        for await (const message of iterator) {
            messages.push(message);
        }
        (0, vitest_1.expect)(messages).toEqual([
            { event: 'completion', data: '{"foo":"bar"}' },
            { event: 'completion', data: '{"baz":"qux"}' },
        ]);
    });
    (0, vitest_1.it)('skips intermediate completion events', async () => {
        async function* createIterator() {
            yield Buffer.from('event: completion\ndata: {"foo":"bar"}\n\nevent: completion\ndata: {"baz":"qux"}\n\n');
        }
        const messages = [];
        const iterator = (0, client_1.createSSEIterator)(stream_1.Readable.from(createIterator()), {
            aggregatedCompletionEvent: true,
        });
        for await (const message of iterator) {
            messages.push(message);
        }
        (0, vitest_1.expect)(messages).toEqual([{ event: 'completion', data: '{"baz":"qux"}' }]);
    });
    (0, vitest_1.it)('handles `: ` in the event name', async () => {
        async function* createIterator() {
            yield Buffer.from('event: foo: bar\ndata: {"baz":"qux"}\n\n');
        }
        const messages = [];
        const iterator = (0, client_1.createSSEIterator)(stream_1.Readable.from(createIterator()));
        for await (const message of iterator) {
            messages.push(message);
        }
        (0, vitest_1.expect)(messages).toEqual([{ event: 'foo: bar', data: '{"baz":"qux"}' }]);
    });
});
