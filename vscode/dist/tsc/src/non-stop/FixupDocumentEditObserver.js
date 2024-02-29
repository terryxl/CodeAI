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
Object.defineProperty(exports, "__esModule", { value: true });
exports.FixupDocumentEditObserver = void 0;
const vscode = __importStar(require("vscode"));
const tracked_range_1 = require("./tracked-range");
const utils_1 = require("./utils");
// This does some thunking to manage the two range types: diff ranges, and
// text change ranges.
function updateDiffRange(range, changes) {
    return toDiffRange((0, tracked_range_1.updateRangeMultipleChanges)(toVsCodeRange(range), changes, { supportRangeAffix: true }));
}
function toDiffRange(range) {
    return {
        start: toDiffPosition(range.start),
        end: toDiffPosition(range.end),
    };
}
function toDiffPosition(position) {
    return { line: position.line, character: position.character };
}
function toVsCodeRange(range) {
    return new vscode.Range(toVsCodePosition(range.start), toVsCodePosition(range.end));
}
function toVsCodePosition(position) {
    return new vscode.Position(position.line, position.character);
}
// Updates the ranges in a diff.
function updateRanges(ranges, changes) {
    for (let i = 0; i < ranges.length; i++) {
        ranges[i] = updateDiffRange(ranges[i], changes);
    }
}
// Updates the range in an edit.
function updateEdits(edits, changes) {
    for (const [i, edit] of edits.entries()) {
        edits[i].range = updateDiffRange(edit.range, changes);
    }
}
/**
 * Observes text document changes and updates the regions with active fixups.
 * Notifies the fixup controller when text being edited by a fixup changes.
 * Fixups must track ranges of interest within documents that are being worked
 * on. Ranges of interest include the region of text we sent to the LLM, and the
 * and the decorations indicating where edits will appear.
 */
class FixupDocumentEditObserver {
    provider_;
    constructor(provider_) {
        this.provider_ = provider_;
    }
    textDocumentChanged(event) {
        const file = this.provider_.maybeFileForUri(event.document.uri);
        if (!file) {
            return;
        }
        const tasks = this.provider_.tasksForFile(file);
        // Notify which tasks have changed text or the range edits apply to
        for (const task of tasks) {
            // Cancel any ongoing `add` tasks on undo.
            // This is to avoid a scenario where a user is trying to undo a specific part of text, but cannot because the streamed text continues to come in as the latest addition.
            if (task.state === utils_1.CodyTaskState.inserting &&
                event.reason === vscode.TextDocumentChangeReason.Undo) {
                this.provider_.cancelTask(task);
                continue;
            }
            for (const edit of event.contentChanges) {
                if (edit.range.end.isBefore(task.selectionRange.start) ||
                    edit.range.start.isAfter(task.selectionRange.end)) {
                    continue;
                }
                this.provider_.textDidChange(task);
                break;
            }
            const changes = new Array(...event.contentChanges);
            const updatedRange = (0, tracked_range_1.updateRangeMultipleChanges)(task.selectionRange, changes, {
                supportRangeAffix: true,
            });
            if (task.diff) {
                updateRanges(task.diff.conflicts, changes);
                updateEdits(task.diff.edits, changes);
                updateRanges(task.diff.highlights, changes);
                // Note, we may not notify the decorator of range changes here
                // if the gross range has not changed. That is OK because
                // VScode moves decorations and we can reproduce them lazily.
            }
            if (!updatedRange.isEqual(task.selectionRange)) {
                task.selectionRange = updatedRange;
                this.provider_.rangeDidChange(task);
            }
            // We keep track of where the original range should be, so we can re-use it for retries.
            // Note: This range doesn't expand or shrink, it needs to match the original range as applied to `task.original`
            const updatedFixedRange = (0, tracked_range_1.updateRangeMultipleChanges)(task.originalRange, changes, {}, tracked_range_1.updateFixedRange);
            if (!updatedFixedRange.isEqual(task.originalRange)) {
                task.originalRange = updatedFixedRange;
            }
        }
    }
}
exports.FixupDocumentEditObserver = FixupDocumentEditObserver;
