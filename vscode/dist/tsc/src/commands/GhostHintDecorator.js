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
exports.GhostHintDecorator = exports.ghostHintDecoration = exports.getGhostHintEnablement = void 0;
const lodash_1 = require("lodash");
const vscode = __importStar(require("vscode"));
const cody_shared_1 = require("@sourcegraph/cody-shared");
const telemetry_v2_1 = require("../services/telemetry-v2");
const telemetry_1 = require("../services/telemetry");
const EDIT_SHORTCUT_LABEL = process.platform === 'win32' ? 'Alt+K' : 'Opt+K';
const CHAT_SHORTCUT_LABEL = process.platform === 'win32' ? 'Alt+L' : 'Opt+L';
/**
 * Checks if the given selection in the document is an incomplete line selection.
 * @param document - The text document containing the selection
 * @param selection - The selection to check
 * @returns boolean - True if the selection does not contain the full range of non-whitespace characters on the line
 */
function isEmptyOrIncompleteSelection(document, selection) {
    if (selection.isEmpty) {
        // Nothing to select
        return true;
    }
    if (!selection.isSingleLine) {
        // Multi line selections are always considered complete
        return false;
    }
    const line = document.lineAt(selection.start.line);
    // Return `true` (incomplete selection) if the selection does not contain the full range of non-whitespace characters on the line
    return (line.firstNonWhitespaceCharacterIndex < selection.start.character ||
        line.range.end.character > selection.end.character);
}
async function getGhostHintEnablement() {
    const config = vscode.workspace.getConfiguration('cody');
    const configSettings = config.inspect('commandHints.enabled');
    // Return the actual configuration setting, if set. Otherwise return the default value from the feature flag.
    return (configSettings?.workspaceValue ??
        configSettings?.globalValue ??
        cody_shared_1.featureFlagProvider.evaluateFeatureFlag(cody_shared_1.FeatureFlag.CodyCommandHints));
}
exports.getGhostHintEnablement = getGhostHintEnablement;
/**
 * Creates a new decoration for showing a "ghost" hint to the user.
 *
 * Note: This needs to be created at extension run time as the order in which `createTextEditorDecorationType`
 * is called affects the ranking of the decoration - assuming multiple decorations.
 *
 * We should also ensure that `activationEvent` `onLanguage` is set to provide the best chance of
 * executing this code early, without impacting VS Code startup time.
 */
exports.ghostHintDecoration = vscode.window.createTextEditorDecorationType({
    isWholeLine: true,
    after: {
        color: new vscode.ThemeColor('editorGhostText.foreground'),
        margin: '0 0 0 1em',
    },
});
const GHOST_TEXT_THROTTLE = 250;
const TELEMETRY_THROTTLE = 30 * 1000; // 30 Seconds
class GhostHintDecorator {
    disposables = [];
    isActive = false;
    activeDecoration = null;
    setThrottledGhostText;
    fireThrottledDisplayEvent;
    enrollmentListener = null;
    constructor(authProvider) {
        this.setThrottledGhostText = (0, lodash_1.throttle)(this.setGhostText.bind(this), GHOST_TEXT_THROTTLE, {
            leading: false,
            trailing: true,
        });
        this.fireThrottledDisplayEvent = (0, lodash_1.throttle)(this._fireDisplayEvent.bind(this), TELEMETRY_THROTTLE, {
            leading: true,
            trailing: false,
        });
        // Set initial state, based on the configuration and authentication status
        const initialAuth = authProvider.getAuthStatus();
        this.updateEnablement(initialAuth);
        // Listen to authentication changes
        authProvider.addChangeListener(authStatus => this.updateEnablement(authStatus));
        // Listen to configuration changes (e.g. if the setting is disabled)
        vscode.workspace.onDidChangeConfiguration(e => {
            if (e.affectsConfiguration('cody')) {
                this.updateEnablement(authProvider.getAuthStatus());
            }
        });
    }
    init() {
        this.disposables.push(vscode.window.onDidChangeTextEditorSelection((event) => {
            const editor = event.textEditor;
            if (editor.document.uri.scheme !== 'file') {
                // Selection changed on a non-file document, e.g. (an output pane)
                // Edit's aren't possible here, so do nothing
                return;
            }
            if (event.selections.length > 1) {
                // Multiple selections, it will be confusing to show the ghost text on all of them, or just the first
                // Clear existing text and avoid showing anything.
                return this.clearGhostText(editor);
            }
            const selection = event.selections[0];
            if (isEmptyOrIncompleteSelection(editor.document, selection)) {
                // Empty or incomplete selection, we can technically do an edit/generate here but it is unlikely the user will want to do so.
                // Clear existing text and avoid showing anything. We don't want the ghost text to spam the user too much.
                return this.clearGhostText(editor);
            }
            /**
             * Sets the target position by determine the adjusted 'active' line filtering out any empty selected lines.
             * Note: We adjust because VS Code will select the beginning of the next line when selecting a whole line.
             */
            const targetPosition = selection.isReversed
                ? selection.active
                : selection.active.translate(selection.end.character === 0 ? -1 : 0);
            if (this.activeDecoration &&
                this.activeDecoration.range.start.line !== targetPosition.line) {
                // Active decoration is incorrectly positioned, remove it before continuing
                this.clearGhostText(editor);
            }
            this.fireThrottledDisplayEvent();
            // Edit code flow, throttled show to avoid spamming whilst the user makes an active selection
            return this.setThrottledGhostText(editor, targetPosition);
        }));
    }
    setGhostText(editor, position) {
        this.activeDecoration = {
            range: new vscode.Range(position, position),
            renderOptions: {
                after: { contentText: `${EDIT_SHORTCUT_LABEL} to Edit, ${CHAT_SHORTCUT_LABEL} to Chat` },
            },
        };
        editor.setDecorations(exports.ghostHintDecoration, [this.activeDecoration]);
    }
    clearGhostText(editor) {
        this.setThrottledGhostText.cancel();
        this.activeDecoration = null;
        editor.setDecorations(exports.ghostHintDecoration, []);
    }
    _fireDisplayEvent() {
        telemetry_1.telemetryService.log('CodyVSCodeExtension:ghostText:visible', { hasV2Event: true });
        telemetry_v2_1.telemetryRecorder.recordEvent('cody.ghostText', 'visible');
    }
    async updateEnablement(authStatus) {
        const featureEnabled = await getGhostHintEnablement();
        this.registerEnrollmentListener(featureEnabled);
        if (!authStatus.isLoggedIn || !featureEnabled) {
            this.dispose();
            return;
        }
        if (!this.isActive) {
            this.isActive = true;
            this.init();
            return;
        }
    }
    /**
     * Register a listener for when the user has enrolled in the ghost hint feature.
     * This code is _only_ to be used to support the ongoing A/B test for ghost hint usage.
     */
    registerEnrollmentListener(featureEnabled) {
        this.enrollmentListener = vscode.window.onDidChangeTextEditorSelection((event) => {
            const editor = event.textEditor;
            /**
             * Matches the logic for actually displaying the ghost text.
             * This is a temporary check to support an ongoing A/B test,
             * that is handled separately as we do this regardless if the ghost text is enabled/disabled
             */
            const ghostTextWouldShow = editor.document.uri.scheme === 'file' &&
                event.selections.length === 1 &&
                !isEmptyOrIncompleteSelection(editor.document, event.selections[0]);
            if (ghostTextWouldShow) {
                // The user will be shown the ghost text in these conditions
                // Log a telemetry event for A/B tracking depending on if the text is enabled or disabled for them.
                telemetry_1.telemetryService.log('CodyVSCodeExtension:experiment:ghostText:enrolled', {
                    variant: featureEnabled ? 'treatment' : 'control',
                }, { hasV2Event: true });
                telemetry_v2_1.telemetryRecorder.recordEvent('cody.experiment.ghostText', 'enrolled', {
                    privateMetadata: { variant: featureEnabled ? 'treatment' : 'control' },
                });
                // Now that we have fired the enrollment event, we can stop listening
                this.enrollmentListener?.dispose();
            }
        });
    }
    dispose() {
        this.isActive = false;
        // Clear any existing ghost text
        if (vscode.window.activeTextEditor) {
            this.clearGhostText(vscode.window.activeTextEditor);
        }
        for (const disposable of this.disposables) {
            disposable.dispose();
        }
        this.disposables = [];
    }
}
exports.GhostHintDecorator = GhostHintDecorator;
