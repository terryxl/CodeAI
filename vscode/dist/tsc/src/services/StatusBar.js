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
exports.createStatusBar = void 0;
const vscode = __importStar(require("vscode"));
const cody_shared_1 = require("@sourcegraph/cody-shared");
const configuration_1 = require("../configuration");
const FeedbackOptions_1 = require("./FeedbackOptions");
const GhostHintDecorator_1 = require("../commands/GhostHintDecorator");
const DEFAULT_TEXT = '$(cody-logo-heavy)';
const DEFAULT_TOOLTIP = 'Cody Settings';
const QUICK_PICK_ITEM_CHECKED_PREFIX = '$(check) ';
const QUICK_PICK_ITEM_EMPTY_INDENT_PREFIX = '\u00A0\u00A0\u00A0\u00A0\u00A0 ';
const ONE_HOUR = 60 * 60 * 1000;
function createStatusBar() {
    const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right);
    statusBarItem.text = DEFAULT_TEXT;
    statusBarItem.tooltip = DEFAULT_TOOLTIP;
    statusBarItem.command = 'cody.status-bar.interacted';
    statusBarItem.show();
    const command = vscode.commands.registerCommand(statusBarItem.command, async () => {
        const workspaceConfig = vscode.workspace.getConfiguration();
        const config = (0, configuration_1.getConfiguration)(workspaceConfig);
        async function createFeatureToggle(name, description, detail, setting, getValue, requiresReload = false, buttons = undefined) {
            const isEnabled = await getValue(config);
            return {
                label: (isEnabled ? QUICK_PICK_ITEM_CHECKED_PREFIX : QUICK_PICK_ITEM_EMPTY_INDENT_PREFIX) +
                    name,
                description,
                detail: QUICK_PICK_ITEM_EMPTY_INDENT_PREFIX + detail,
                onSelect: async () => {
                    await workspaceConfig.update(setting, !isEnabled, vscode.ConfigurationTarget.Global);
                    const info = `${name} ${isEnabled ? 'disabled' : 'enabled'}.`;
                    const response = await (requiresReload
                        ? vscode.window.showInformationMessage(info, 'Reload Window')
                        : vscode.window.showInformationMessage(info));
                    if (response === 'Reload Window') {
                        await vscode.commands.executeCommand('workbench.action.reloadWindow');
                    }
                },
                buttons,
            };
        }
        if (errors.length > 0) {
            errors.map(error => error.error.onShow?.());
        }
        const quickPick = vscode.window.createQuickPick();
        quickPick.items = [
            // These description should stay in sync with the settings in package.json
            ...(errors.length > 0
                ? [
                    { label: 'notice', kind: vscode.QuickPickItemKind.Separator },
                    ...errors.map(error => ({
                        label: `$(alert) ${error.error.title}`,
                        description: '',
                        detail: QUICK_PICK_ITEM_EMPTY_INDENT_PREFIX + error.error.description,
                        onSelect() {
                            error.error.onSelect?.();
                            const index = errors.indexOf(error);
                            errors.splice(index);
                            rerender();
                            return Promise.resolve();
                        },
                    })),
                ]
                : []),
            { label: 'enable/disable features', kind: vscode.QuickPickItemKind.Separator },
            await createFeatureToggle('Code Autocomplete', undefined, 'Enable Cody-powered code autocompletions', 'cody.autocomplete.enabled', c => c.autocomplete, false, [
                {
                    iconPath: new vscode.ThemeIcon('settings-more-action'),
                    tooltip: 'Autocomplete Settings',
                    onClick: () => vscode.commands.executeCommand('workbench.action.openSettings', {
                        query: '@ext:sourcegraph.cody-ai autocomplete',
                    }),
                },
            ]),
            await createFeatureToggle('Code Actions', undefined, 'Enable Cody fix and explain options in the Quick Fix menu', 'cody.codeActions.enabled', c => c.codeActions),
            await createFeatureToggle('Editor Title Icon', undefined, 'Enable Cody to appear in editor title menu for quick access to Cody commands', 'cody.editorTitleCommandIcon', c => c.editorTitleCommandIcon),
            await createFeatureToggle('Code Lenses', undefined, 'Enable Code Lenses in documents for quick access to Cody commands', 'cody.commandCodeLenses', c => c.commandCodeLenses),
            await createFeatureToggle('Command Hints', undefined, 'Enable hints for Edit and Chat shortcuts, displayed alongside editor selections', 'cody.commandHints.enabled', GhostHintDecorator_1.getGhostHintEnablement),
            await createFeatureToggle('Search Context', 'Beta', 'Enable using the natural language search index as an Enhanced Context chat source', 'cody.experimental.symfContext', c => c.experimentalSymfContext, false),
            { label: 'settings', kind: vscode.QuickPickItemKind.Separator },
            {
                label: '$(gear) Cody Extension Settings',
                async onSelect() {
                    await vscode.commands.executeCommand('cody.settings.extension');
                },
            },
            {
                label: '$(symbol-namespace) Custom Commands Settings',
                async onSelect() {
                    await vscode.commands.executeCommand('cody.menu.commands-settings');
                },
            },
            { label: 'feedback & support', kind: vscode.QuickPickItemKind.Separator },
            ...FeedbackOptions_1.FeedbackOptionItems,
        ];
        quickPick.title = 'Cody Settings';
        quickPick.placeholder = 'Choose an option';
        quickPick.matchOnDescription = true;
        quickPick.show();
        quickPick.onDidAccept(() => {
            const option = quickPick.activeItems[0];
            if (option && 'onSelect' in option) {
                option.onSelect().catch(console.error);
            }
            quickPick.hide();
        });
        quickPick.onDidTriggerItemButton(item => {
            // @ts-ignore: onClick is a custom extension to the QuickInputButton
            item?.button?.onClick?.();
            quickPick.hide();
        });
    });
    // Reference counting to ensure loading states are handled consistently across different
    // features
    // TODO: Ensure the label is always set to the right value too.
    let openLoadingLeases = 0;
    const errors = [];
    function rerender() {
        if (openLoadingLeases > 0) {
            statusBarItem.text = '$(loading~spin)';
        }
        else {
            statusBarItem.text = DEFAULT_TEXT;
            statusBarItem.tooltip = DEFAULT_TOOLTIP;
        }
        if (errors.length > 0) {
            statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
            statusBarItem.tooltip = errors[0].error.title;
        }
        else {
            statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.activeBackground');
        }
    }
    // Clean up all errors after a certain time so they don't accumulate forever
    function clearOutdatedErrors() {
        const now = Date.now();
        for (let i = errors.length - 1; i >= 0; i--) {
            const error = errors[i];
            if (now - error.createdAt >= ONE_HOUR) {
                errors.splice(i, 1);
            }
        }
        rerender();
    }
    // NOTE: Behind unstable feature flag and requires .cody/ignore enabled
    // Listens for changes to the active text editor and updates the status bar text
    // based on whether the active file is ignored by Cody or not.
    // If ignored, adds 'Ignored' to the status bar text.
    // Otherwise, rerenders the status bar.
    const verifyActiveEditor = (uri) => {
        // NOTE: Non-file URIs are not supported by the .cody/ignore files and
        // are ignored by default. As they are files that a user would not expect to
        // be used by Cody, we will not display them with the "warning".
        if (uri?.scheme === 'file' && (0, cody_shared_1.isCodyIgnoredFile)(uri)) {
            statusBarItem.tooltip = 'Current file is ignored by Cody';
            statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
        }
        else {
            rerender();
        }
    };
    const onDocumentChange = vscode.window.onDidChangeActiveTextEditor(e => {
        verifyActiveEditor(e?.document?.uri);
    });
    verifyActiveEditor(vscode.window.activeTextEditor?.document?.uri);
    return {
        startLoading(label, params = {}) {
            openLoadingLeases++;
            statusBarItem.tooltip = label;
            rerender();
            let didClose = false;
            const timeoutId = params.timeoutMs ? setTimeout(stopLoading, params.timeoutMs) : null;
            function stopLoading() {
                if (didClose) {
                    return;
                }
                didClose = true;
                openLoadingLeases--;
                rerender();
                if (timeoutId) {
                    clearTimeout(timeoutId);
                }
            }
            return stopLoading;
        },
        addError(error) {
            const errorObject = { error, createdAt: Date.now() };
            errors.push(errorObject);
            setTimeout(clearOutdatedErrors, ONE_HOUR);
            rerender();
            return () => {
                const index = errors.indexOf(errorObject);
                if (index !== -1) {
                    errors.splice(index, 1);
                    rerender();
                }
            };
        },
        hasError(errorName) {
            return errors.some(e => e.error.errorType === errorName);
        },
        dispose() {
            statusBarItem.dispose();
            command.dispose();
            onDocumentChange.dispose();
        },
    };
}
exports.createStatusBar = createStatusBar;
