"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const telemetry_1 = require("../services/telemetry");
const telemetry_v2_1 = require("../services/telemetry-v2");
const textDocument_1 = require("../testutils/textDocument");
const persistence_tracker_1 = require("./persistence-tracker");
const test_helpers_1 = require("./test-helpers");
const completionId = '123';
(0, vitest_1.describe)('PersistenceTracker', () => {
    let logSpy;
    let recordSpy;
    let tracker;
    // Mock workspace APIs to trigger document changes
    let onDidChangeTextDocument;
    let onDidRenameFiles;
    let onDidDeleteFiles;
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.useFakeTimers();
        logSpy = vitest_1.vi.spyOn(telemetry_1.telemetryService, 'log');
        recordSpy = vitest_1.vi.spyOn(telemetry_v2_1.telemetryRecorder, 'recordEvent');
        tracker = new persistence_tracker_1.PersistenceTracker({
            onDidChangeTextDocument(listener) {
                onDidChangeTextDocument = listener;
                return { dispose: () => { } };
            },
            onDidRenameFiles(listener) {
                onDidRenameFiles = listener;
                return { dispose: () => { } };
            },
            onDidDeleteFiles(listener) {
                onDidDeleteFiles = listener;
                return { dispose: () => { } };
            },
        });
    });
    (0, vitest_1.afterEach)(() => {
        tracker.dispose();
    });
    (0, vitest_1.it)('tracks completions over time when there are no document changes', () => {
        // This document is in the state _after_ the completion was inserted
        const doc = (0, test_helpers_1.document)('foo');
        tracker.track({
            id: completionId,
            insertedAt: Date.now(),
            insertText: 'foo',
            insertRange: (0, textDocument_1.range)(0, 0, 0, 0),
            document: doc,
        });
        const sharedArgs = {
            id: '123',
            charCount: 3,
            difference: 0,
            lineCount: 1,
        };
        vitest_1.vi.advanceTimersByTime(30 * 1000);
        (0, vitest_1.expect)(logSpy).toHaveBeenCalledWith('CodyVSCodeExtension:completion:persistence:present', {
            ...sharedArgs,
            afterSec: 30,
        }, { agent: true, hasV2Event: true });
        (0, vitest_1.expect)(recordSpy).toHaveBeenCalledWith('cody.completion', 'persistence:present', vitest_1.expect.anything());
        vitest_1.vi.advanceTimersByTime(90 * 1000);
        (0, vitest_1.expect)(logSpy).toHaveBeenCalledWith('CodyVSCodeExtension:completion:persistence:present', {
            ...sharedArgs,
            afterSec: 120,
        }, { agent: true, hasV2Event: true });
        (0, vitest_1.expect)(recordSpy).toHaveBeenCalledWith('cody.completion', 'persistence:present', vitest_1.expect.anything());
        vitest_1.vi.advanceTimersByTime(3 * 60 * 1000);
        (0, vitest_1.expect)(logSpy).toHaveBeenCalledWith('CodyVSCodeExtension:completion:persistence:present', {
            ...sharedArgs,
            afterSec: 300,
        }, { agent: true, hasV2Event: true });
        (0, vitest_1.expect)(recordSpy).toHaveBeenCalledWith('cody.completion', 'persistence:present', vitest_1.expect.anything());
        vitest_1.vi.advanceTimersByTime(5 * 60 * 1000);
        (0, vitest_1.expect)(logSpy).toHaveBeenCalledWith('CodyVSCodeExtension:completion:persistence:present', {
            ...sharedArgs,
            afterSec: 600,
        }, { agent: true, hasV2Event: true });
        (0, vitest_1.expect)(recordSpy).toHaveBeenCalledWith('cody.completion', 'persistence:present', vitest_1.expect.anything());
    });
    (0, vitest_1.it)('tracks changes to the document', () => {
        // This document is in the state _after_ the completion was inserted
        const doc = (0, test_helpers_1.document)('foo');
        tracker.track({
            id: completionId,
            insertedAt: Date.now(),
            insertText: 'foo',
            insertRange: (0, textDocument_1.range)(0, 0, 0, 0),
            document: doc,
        });
        const sharedArgs = {
            id: '123',
            charCount: 3,
            lineCount: 1,
        };
        vitest_1.vi.advanceTimersToNextTimer();
        (0, vitest_1.expect)(logSpy).toHaveBeenCalledWith('CodyVSCodeExtension:completion:persistence:present', {
            ...sharedArgs,
            afterSec: 30,
            difference: 0,
        }, { agent: true, hasV2Event: true });
        (0, vitest_1.expect)(recordSpy).toHaveBeenCalledWith('cody.completion', 'persistence:present', vitest_1.expect.anything());
        vitest_1.vi.spyOn(doc, 'getText').mockImplementationOnce(() => 'fo0');
        onDidChangeTextDocument({
            document: doc,
            contentChanges: [
                {
                    range: (0, textDocument_1.range)(0, 2, 0, 3),
                    text: '0',
                    rangeLength: 0,
                    rangeOffset: 0,
                },
            ],
            reason: undefined,
        });
        vitest_1.vi.advanceTimersToNextTimer();
        (0, vitest_1.expect)(logSpy).toHaveBeenCalledWith('CodyVSCodeExtension:completion:persistence:present', {
            ...sharedArgs,
            afterSec: 120,
            difference: 1 / 3,
        }, { agent: true, hasV2Event: true });
        (0, vitest_1.expect)(recordSpy).toHaveBeenCalledWith('cody.completion', 'persistence:present', vitest_1.expect.anything());
    });
    (0, vitest_1.it)('tracks changes after renaming a document', () => {
        // This document is in the state _after_ the completion was inserted
        const doc = (0, test_helpers_1.document)('foo');
        tracker.track({
            id: completionId,
            insertedAt: Date.now(),
            insertText: 'foo',
            insertRange: (0, textDocument_1.range)(0, 0, 0, 0),
            document: doc,
        });
        const renamedDoc = (0, test_helpers_1.document)('fo0', 'typescript', 'file:///test2.ts');
        onDidRenameFiles({
            files: [
                {
                    oldUri: doc.uri,
                    newUri: renamedDoc.uri,
                },
            ],
        });
        vitest_1.vi.spyOn(doc, 'getText').mockImplementationOnce(() => 'fo0');
        onDidChangeTextDocument({
            document: renamedDoc,
            contentChanges: [
                {
                    range: (0, textDocument_1.range)(0, 2, 0, 3),
                    text: '0',
                    rangeLength: 0,
                    rangeOffset: 0,
                },
            ],
            reason: undefined,
        });
        vitest_1.vi.advanceTimersToNextTimer();
        (0, vitest_1.expect)(logSpy).toHaveBeenCalledWith('CodyVSCodeExtension:completion:persistence:present', {
            afterSec: 30,
            charCount: 3,
            difference: 1 / 3,
            id: '123',
            lineCount: 1,
        }, { agent: true, hasV2Event: true });
        (0, vitest_1.expect)(recordSpy).toHaveBeenCalledWith('cody.completion', 'persistence:present', vitest_1.expect.anything());
    });
    (0, vitest_1.it)('gracefully handles file deletions', () => {
        // This document is in the state _after_ the completion was inserted
        const doc = (0, test_helpers_1.document)('foo');
        tracker.track({
            id: completionId,
            insertedAt: Date.now(),
            insertText: 'foo',
            insertRange: (0, textDocument_1.range)(0, 0, 0, 0),
            document: doc,
        });
        onDidDeleteFiles({ files: [doc.uri] });
        vitest_1.vi.advanceTimersToNextTimer();
        (0, vitest_1.expect)(logSpy).not.toHaveBeenCalled();
        (0, vitest_1.expect)(recordSpy).not.toHaveBeenCalled();
    });
    (0, vitest_1.it)('tracks the deletion of a range', () => {
        // This document is in the state _after_ the completion was inserted
        const doc = (0, test_helpers_1.document)('');
        tracker.track({
            id: completionId,
            insertedAt: Date.now(),
            insertText: 'foo',
            insertRange: (0, textDocument_1.range)(0, 0, 0, 0),
            document: doc,
        });
        vitest_1.vi.advanceTimersToNextTimer();
        (0, vitest_1.expect)(logSpy).toHaveBeenCalledWith('CodyVSCodeExtension:completion:persistence:removed', {
            id: '123',
        }, { agent: true, hasV2Event: true });
        (0, vitest_1.expect)(recordSpy).toHaveBeenCalledWith('cody.completion', 'persistence:removed', vitest_1.expect.anything());
    });
});
