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
exports.FixupDecorator = void 0;
const vscode = __importStar(require("vscode"));
function makeDecorations(diff) {
    if (!diff) {
        return {
            edits: [],
            conflicts: [],
        };
    }
    return {
        edits: diff.edits.map(edit => new vscode.Range(new vscode.Position(edit.range.start.line, edit.range.start.character), new vscode.Position(edit.range.end.line, edit.range.end.character))),
        conflicts: diff.conflicts.map(conflict => new vscode.Range(new vscode.Position(conflict.start.line, conflict.start.character), new vscode.Position(conflict.end.line, conflict.end.character))),
    };
}
// TODO: Consider constraining decorations to visible ranges.
class FixupDecorator {
    decorationCodyConflictMarker_;
    decorationCodyConflicted_;
    decorationCodyIncoming_;
    decorations_ = new Map();
    constructor() {
        this.decorationCodyConflictMarker_ = vscode.window.createTextEditorDecorationType({
            backgroundColor: new vscode.ThemeColor('cody.fixup.conflictBackground'),
            borderColor: new vscode.ThemeColor('cody.fixup.conflictBorder'),
            borderStyle: 'solid',
            borderWidth: '1px',
        });
        this.decorationCodyConflicted_ = vscode.window.createTextEditorDecorationType({
            backgroundColor: new vscode.ThemeColor('cody.fixup.conflictedBackground'),
            borderColor: new vscode.ThemeColor('cody.fixup.conflictedBorder'),
            borderStyle: 'solid',
            borderWidth: '1px',
        });
        this.decorationCodyIncoming_ = vscode.window.createTextEditorDecorationType({
            backgroundColor: new vscode.ThemeColor('cody.fixup.incomingBackground'),
            borderColor: new vscode.ThemeColor('cody.fixup.incomingBorder'),
            borderStyle: 'solid',
            borderWidth: '1px',
        });
    }
    dispose() {
        this.decorationCodyConflictMarker_.dispose();
        this.decorationCodyConflicted_.dispose();
        this.decorationCodyIncoming_.dispose();
    }
    didChangeVisibleTextEditors(file, editors) {
        this.applyDecorations(editors, this.decorations_.get(file)?.values() || [].values());
    }
    didUpdateDiff(task) {
        this.updateTaskDecorations(task, task.diff);
    }
    didCompleteTask(task) {
        this.updateTaskDecorations(task, undefined);
    }
    updateTaskDecorations(task, diff) {
        const decorations = makeDecorations(diff);
        const isEmpty = decorations.edits.length === 0 && decorations.conflicts.length === 0;
        let fileTasks = this.decorations_.get(task.fixupFile);
        if (!fileTasks && isEmpty) {
            // The file was not decorated; we have no decorations. Do nothing.
            return;
        }
        if (isEmpty) {
            if (fileTasks?.has(task)) {
                // There were old decorations; remove them.
                fileTasks.delete(task);
                this.didChangeFileDecorations(task.fixupFile);
            }
            return;
        }
        if (!fileTasks) {
            // Create the map to hold this file's decorations.
            fileTasks = new Map();
            this.decorations_.set(task.fixupFile, fileTasks);
        }
        fileTasks.set(task, decorations);
        this.didChangeFileDecorations(task.fixupFile);
    }
    didChangeFileDecorations(file) {
        // TODO: Cache the changed files and update the decorations together.
        const editors = vscode.window.visibleTextEditors.filter(editor => editor.document.uri === file.uri);
        if (!editors.length) {
            return;
        }
        this.applyDecorations(editors, this.decorations_.get(file)?.values() || [].values());
    }
    applyDecorations(editors, decorations) {
        const incoming = [];
        const conflicted = [];
        const conflicts = [];
        for (const decoration of decorations) {
            ;
            (decoration.conflicts.length ? conflicted : incoming).push(...decoration.edits);
            conflicts.push(...decoration.conflicts);
        }
        for (const editor of editors) {
            editor.setDecorations(this.decorationCodyConflictMarker_, conflicts);
            editor.setDecorations(this.decorationCodyConflicted_, conflicted);
            editor.setDecorations(this.decorationCodyIncoming_, incoming);
        }
    }
}
exports.FixupDecorator = FixupDecorator;
