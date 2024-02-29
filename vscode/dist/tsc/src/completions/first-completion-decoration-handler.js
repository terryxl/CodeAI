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
exports.FirstCompletionDecorationHandler = void 0;
const vscode = __importStar(require("vscode"));
/**
 * Handles showing an in-editor decoration when a first completion is accepted.
 */
class FirstCompletionDecorationHandler {
    /**
     * Duration to show decoration before automatically hiding.
     *
     * Modifying the document will also immediately hide.
     */
    static decorationDurationMilliseconds = 10000;
    /**
     * A subscription watching for file changes to automatically hide the decoration.
     *
     * This subscription will be cancelled once the decoration is hidden (for any reason).
     */
    editorChangeSubscription;
    /**
     * A timer to hide the decoration automatically.
     */
    hideTimer;
    decorationType = vscode.window.createTextEditorDecorationType({
        after: {
            margin: '0 0 0 40px',
            contentText: '    🎉 You just accepted your first Cody autocomplete!',
            color: new vscode.ThemeColor('editorGhostText.foreground'),
        },
        isWholeLine: true,
    });
    /**
     * Shows the decoration if the editor is still active.
     */
    show(request) {
        // We need an editor to show decorations. We don't want to blindly open request.document
        // if somehow it's no longer active, so check if the current active editor is the right
        // one. It's almost certainly the case.
        const editor = vscode.window.activeTextEditor;
        if (editor?.document !== request.document) {
            return;
        }
        // Show the decoration at the position of the completion request. Because we set isWholeLine=true
        // it'll always be shown at the end of this line, regardless of the length of the completion.
        editor.setDecorations(this.decorationType, [
            new vscode.Range(request.position, request.position),
        ]);
        // Hide automatically after a time..
        this.hideTimer = setTimeout(() => this.hide(editor), FirstCompletionDecorationHandler.decorationDurationMilliseconds);
        // But also listen for changes to automatically hide if the user starts typing so that we're never
        // in the way.
        //
        // We should never be called twice, but just in case dispose any existing sub to ensure we don't leak.
        this.editorChangeSubscription = vscode.workspace.onDidChangeTextDocument(e => {
            if (e.document === editor.document) {
                this.hide(editor);
            }
        });
    }
    /**
     * Hides the decoration and clears any active subscription/timeout.
     */
    hide(editor) {
        clearTimeout(this.hideTimer);
        this.editorChangeSubscription?.dispose();
        editor.setDecorations(this.decorationType, []);
    }
}
exports.FirstCompletionDecorationHandler = FirstCompletionDecorationHandler;
