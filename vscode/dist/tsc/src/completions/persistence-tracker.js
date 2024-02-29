"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PersistenceTracker = void 0;
const js_levenshtein_1 = __importDefault(require("js-levenshtein"));
const vscode = __importStar(require("vscode"));
const tracked_range_1 = require("../non-stop/tracked-range");
const logger_1 = require("./logger");
const text_processing_1 = require("./text-processing");
const MEASURE_TIMEOUTS = [
    30 * 1000, // 30 seconds
    120 * 1000, // 2 minutes
    300 * 1000, // 5 minutes
    600 * 1000, // 10 minutes
];
class PersistenceTracker {
    disposables = [];
    managedTimeouts = new Set();
    // We use a map from the document URI to the set of tracked completions inside that document to
    // improve performance of the `onDidChangeTextDocument` event handler.
    trackedCompletions = new Map();
    constructor(workspace = vscode.workspace) {
        this.disposables.push(workspace.onDidChangeTextDocument(this.onDidChangeTextDocument.bind(this)));
        this.disposables.push(workspace.onDidRenameFiles(this.onDidRenameFiles.bind(this)));
        this.disposables.push(workspace.onDidDeleteFiles(this.onDidDeleteFiles.bind(this)));
    }
    track({ id, insertedAt, insertText, insertRange, document, }) {
        if (insertText.length === 0) {
            return;
        }
        // The range for the completion is relative to the state before the completion was inserted.
        // We need to convert it to the state after the completion was inserted.
        const textLines = (0, text_processing_1.lines)(insertText);
        const latestRange = new vscode.Range(insertRange.start.line, insertRange.start.character, insertRange.end.line + textLines.length - 1, textLines.length > 1
            ? textLines.at(-1).length
            : insertRange.end.character + textLines[0].length);
        const trackedCompletion = {
            insertText,
            insertRange,
            document,
            id,
            insertedAt,
            latestRange,
            uri: document.uri,
        };
        let documentCompletions = this.trackedCompletions.get(document.uri.toString());
        if (!documentCompletions) {
            documentCompletions = new Set([]);
            this.trackedCompletions.set(document.uri.toString(), documentCompletions);
        }
        documentCompletions.add(trackedCompletion);
        const firstTimeoutIndex = 0;
        this.enqueueMeasure(trackedCompletion, firstTimeoutIndex);
    }
    enqueueMeasure(trackedCompletion, nextTimeoutIndex) {
        const timeout = trackedCompletion.insertedAt + MEASURE_TIMEOUTS[nextTimeoutIndex] - Date.now();
        const timeoutId = setTimeout(() => {
            this.managedTimeouts.delete(timeoutId);
            this.measure(trackedCompletion, nextTimeoutIndex);
        }, timeout);
        this.managedTimeouts.add(timeoutId);
    }
    measure(trackedCompletion, 
    // The index in the MEASURE_TIMEOUTS array
    measureTimeoutsIndex) {
        const isStillTracked = this.trackedCompletions
            .get(trackedCompletion.uri.toString())
            ?.has(trackedCompletion);
        if (!isStillTracked) {
            return;
        }
        const initialText = trackedCompletion.insertText;
        const latestText = trackedCompletion.document.getText(trackedCompletion.latestRange);
        if (latestText.length === 0) {
            // Text was fully deleted
            (0, logger_1.logCompletionPersistenceRemovedEvent)({ id: trackedCompletion.id });
        }
        else {
            const maxLength = Math.max(initialText.length, latestText.length);
            const editOperations = (0, js_levenshtein_1.default)(initialText, latestText);
            const difference = editOperations / maxLength;
            (0, logger_1.logCompletionPersistencePresentEvent)({
                id: trackedCompletion.id,
                afterSec: MEASURE_TIMEOUTS[measureTimeoutsIndex] / 1000,
                difference,
                lineCount: trackedCompletion.latestRange.end.line -
                    trackedCompletion.latestRange.start.line +
                    1,
                charCount: latestText.length,
            });
            // If the text is not deleted yet and there are more timeouts, schedule a new run.
            if (measureTimeoutsIndex < MEASURE_TIMEOUTS.length - 1) {
                this.enqueueMeasure(trackedCompletion, measureTimeoutsIndex + 1);
                return;
            }
        }
        // Remove the completion from the tracking set.
        const documentCompletions = this.trackedCompletions.get(trackedCompletion.uri.toString());
        if (!documentCompletions) {
            return;
        }
        documentCompletions.delete(trackedCompletion);
        if (documentCompletions.size === 0) {
            this.trackedCompletions.delete(trackedCompletion.uri.toString());
        }
    }
    onDidChangeTextDocument(event) {
        const documentCompletions = this.trackedCompletions.get(event.document.uri.toString());
        if (!documentCompletions) {
            return;
        }
        // Create a list of changes that can be mutated by the `updateRangeMultipleChanges` function
        const mutableChanges = event.contentChanges.map(change => ({
            range: change.range,
            text: change.text,
        }));
        for (const trackedCompletion of documentCompletions) {
            trackedCompletion.latestRange = (0, tracked_range_1.updateRangeMultipleChanges)(trackedCompletion.latestRange, mutableChanges);
        }
    }
    onDidRenameFiles(event) {
        for (const file of event.files) {
            const documentCompletions = this.trackedCompletions.get(file.oldUri.toString());
            if (documentCompletions) {
                this.trackedCompletions.set(file.newUri.toString(), documentCompletions);
                this.trackedCompletions.delete(file.oldUri.toString());
                // Note: We maintain a reference to the TextDocument. After a renaming, this will
                // still be able to read content for the right file (I tested this). However, the
                // TextDocument#uri for this will then resolve to the previous URI (it seems to be
                // cached) so we need to update a manual copy of that URI
                for (const trackedCompletion of documentCompletions) {
                    trackedCompletion.uri = file.newUri;
                }
            }
        }
    }
    onDidDeleteFiles(event) {
        for (const uri of event.files) {
            this.trackedCompletions.delete(uri.toString());
        }
    }
    dispose() {
        for (const timeoutId of this.managedTimeouts) {
            clearTimeout(timeoutId);
        }
        this.managedTimeouts.clear();
        this.trackedCompletions.clear();
        for (const disposable of this.disposables) {
            disposable.dispose();
        }
    }
}
exports.PersistenceTracker = PersistenceTracker;
