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
exports.getInput = void 0;
const vscode = __importStar(require("vscode"));
const cody_json_1 = require("../../commands/execute/cody.json");
const active_editor_1 = require("../../editor/active-editor");
const utils_1 = require("./utils");
const tracked_range_1 = require("../../non-stop/tracked-range");
const quick_pick_1 = require("./quick-pick");
const constants_1 = require("./constants");
const get_matching_context_1 = require("./get-matching-context");
const edit_1 = require("./get-items/edit");
const model_1 = require("./get-items/model");
const range_1 = require("./get-items/range");
const document_1 = require("./get-items/document");
const test_1 = require("./get-items/test");
const execute_1 = require("../execute");
const constants_2 = require("./get-items/constants");
const models_1 = require("../../models");
const edit_models_1 = require("../utils/edit-models");
const protocol_1 = require("../../chat/protocol");
const telemetry_v2_1 = require("../../services/telemetry-v2");
const edit_intent_1 = require("../utils/edit-intent");
const PREVIEW_RANGE_DECORATION = vscode.window.createTextEditorDecorationType({
    backgroundColor: new vscode.ThemeColor('editor.wordHighlightTextBackground'),
    borderColor: new vscode.ThemeColor('editor.wordHighlightTextBorder'),
    borderWidth: '3px',
    borderStyle: 'solid',
});
const getInput = async (document, authProvider, initialValues, source) => {
    const editor = (0, active_editor_1.getEditor)().active;
    if (!editor) {
        return null;
    }
    const initialCursorPosition = editor.selection.active;
    let activeRange = initialValues.initialExpandedRange || initialValues.initialRange;
    let activeRangeItem = initialValues.initialIntent === 'add'
        ? constants_2.CURSOR_RANGE_ITEM
        : initialValues.initialExpandedRange
            ? constants_2.EXPANDED_RANGE_ITEM
            : constants_2.SELECTION_RANGE_ITEM;
    const authStatus = authProvider.getAuthStatus();
    const isCodyPro = !authStatus.userCanUpgrade;
    const modelOptions = (0, edit_models_1.getEditModelsForUser)(authStatus);
    const modelItems = (0, model_1.getModelOptionItems)(modelOptions, isCodyPro);
    const showModelSelector = modelOptions.length > 1 && authStatus.isDotCom;
    let activeModel = initialValues.initialModel;
    let activeModelItem = modelItems.find(item => item.model === initialValues.initialModel);
    // ContextItems to store possible user-provided context
    const contextItems = new Map();
    const selectedContextItems = new Map();
    // Initialize the selectedContextItems with any previous items
    // This is primarily for edit retries, where a user may want to reuse their context
    for (const file of initialValues.initialSelectedContextFiles ?? []) {
        selectedContextItems.set((0, utils_1.getLabelForContextFile)(file), file);
    }
    /**
     * Set the title of the quick pick to include the file and range
     * Update the title as the range changes
     */
    const relativeFilePath = vscode.workspace.asRelativePath(document.uri.fsPath);
    let activeTitle;
    const updateActiveTitle = (newRange) => {
        const fileRange = (0, utils_1.getTitleRange)(newRange);
        activeTitle = `Edit ${relativeFilePath}:${fileRange} with Cody`;
    };
    updateActiveTitle(activeRange);
    /**
     * Listens for text document changes and updates the range when changes occur.
     * This allows the range to stay in sync if the user continues editing after
     * requesting the refactoring.
     */
    const registerRangeListener = () => {
        return vscode.workspace.onDidChangeTextDocument(event => {
            if (event.document !== document) {
                return;
            }
            const changes = new Array(...event.contentChanges);
            const updatedRange = (0, tracked_range_1.updateRangeMultipleChanges)(activeRange, changes);
            if (!updatedRange.isEqual(activeRange)) {
                activeRange = updatedRange;
                updateActiveTitle(activeRange);
            }
        });
    };
    let textDocumentListener = registerRangeListener();
    const updateActiveRange = (range) => {
        // Clear any set decorations
        editor.setDecorations(PREVIEW_RANGE_DECORATION, []);
        // Pause listening to range changes to avoid a possible race condition
        textDocumentListener.dispose();
        editor.selection = new vscode.Selection(range.start, range.end);
        activeRange = range;
        // Resume listening to range changes
        textDocumentListener = registerRangeListener();
        // Update the title to reflect the new range
        updateActiveTitle(activeRange);
    };
    const previewActiveRange = (range) => {
        editor.setDecorations(PREVIEW_RANGE_DECORATION, [range]);
        editor.revealRange(range, vscode.TextEditorRevealType.InCenterIfOutsideViewport);
    };
    previewActiveRange(activeRange);
    // Start fetching symbols early, so they can be used immediately if an option is selected
    const symbolsPromise = (0, utils_1.fetchDocumentSymbols)(document);
    return new Promise(resolve => {
        const modelInput = (0, quick_pick_1.createQuickPick)({
            title: activeTitle,
            placeHolder: 'Select a model',
            getItems: () => (0, model_1.getModelInputItems)(modelOptions, activeModel, isCodyPro),
            buttons: [vscode.QuickInputButtons.Back],
            onDidHide: () => editor.setDecorations(PREVIEW_RANGE_DECORATION, []),
            onDidTriggerButton: () => editInput.render(activeTitle, editInput.input.value),
            onDidAccept: async (item) => {
                const acceptedItem = item;
                if (!acceptedItem) {
                    return;
                }
                telemetry_v2_1.telemetryRecorder.recordEvent('cody.fixup.input.model', 'selected');
                if (acceptedItem.codyProOnly && !isCodyPro) {
                    // Temporarily ignore focus out, so that the user can return to the quick pick if desired.
                    modelInput.input.ignoreFocusOut = true;
                    const option = await vscode.window.showInformationMessage('Upgrade to Cody Pro', {
                        modal: true,
                        detail: `Upgrade to Cody Pro to use ${acceptedItem.modelTitle} for Edit`,
                    }, 'Upgrade', 'See Plans');
                    // Both options go to the same URL
                    if (option) {
                        void vscode.env.openExternal(vscode.Uri.parse(protocol_1.ACCOUNT_UPGRADE_URL.toString()));
                    }
                    // Restore the default focus behaviour
                    modelInput.input.ignoreFocusOut = false;
                    return;
                }
                models_1.editModel.set(acceptedItem.model);
                activeModelItem = acceptedItem;
                activeModel = acceptedItem.model;
                editInput.render(activeTitle, editInput.input.value);
            },
        });
        const rangeInput = (0, quick_pick_1.createQuickPick)({
            title: activeTitle,
            placeHolder: 'Select a range to edit',
            getItems: () => (0, range_1.getRangeInputItems)(document, { ...initialValues, initialCursorPosition }, activeRange, symbolsPromise),
            buttons: [vscode.QuickInputButtons.Back],
            onDidTriggerButton: () => editInput.render(activeTitle, editInput.input.value),
            onDidHide: () => editor.setDecorations(PREVIEW_RANGE_DECORATION, []),
            onDidChangeActive: async (items) => {
                const item = items[0];
                if (item) {
                    const range = item.range instanceof vscode.Range ? item.range : await item.range();
                    previewActiveRange(range);
                }
            },
            onDidAccept: async (item) => {
                const acceptedItem = item;
                if (!acceptedItem) {
                    return;
                }
                telemetry_v2_1.telemetryRecorder.recordEvent('cody.fixup.input.range', 'selected');
                activeRangeItem = acceptedItem;
                const range = acceptedItem.range instanceof vscode.Range
                    ? acceptedItem.range
                    : await acceptedItem.range();
                updateActiveRange(range);
                editInput.render(activeTitle, editInput.input.value);
            },
        });
        const documentInput = (0, quick_pick_1.createQuickPick)({
            title: activeTitle,
            placeHolder: 'Select a symbol to document',
            getItems: () => (0, document_1.getDocumentInputItems)(document, initialValues, activeRange, symbolsPromise),
            buttons: [vscode.QuickInputButtons.Back],
            onDidTriggerButton: () => editInput.render(activeTitle, editInput.input.value),
            onDidHide: () => editor.setDecorations(PREVIEW_RANGE_DECORATION, []),
            onDidChangeActive: async (items) => {
                const item = items[0];
                if (item) {
                    const range = item.range instanceof vscode.Range ? item.range : await item.range();
                    previewActiveRange(range);
                }
            },
            onDidAccept: async (item) => {
                const acceptedItem = item;
                if (!acceptedItem) {
                    return;
                }
                const range = acceptedItem.range instanceof vscode.Range
                    ? acceptedItem.range
                    : await acceptedItem.range();
                // Expand the range from the node to include the full lines
                const fullDocumentableRange = new vscode.Range(document.lineAt(range.start.line).range.start, document.lineAt(range.end.line).range.end);
                updateActiveRange(fullDocumentableRange);
                // Hide the input and execute a new edit for 'Document'
                documentInput.input.hide();
                return (0, execute_1.executeEdit)({
                    configuration: {
                        document,
                        instruction: cody_json_1.commands.doc.prompt,
                        range: activeRange,
                        intent: 'doc',
                        mode: 'insert',
                        contextMessages: [],
                        userContextFiles: [],
                    },
                    source: 'menu',
                });
            },
        });
        const unitTestInput = (0, quick_pick_1.createQuickPick)({
            title: activeTitle,
            placeHolder: 'Select a symbol to generate tests',
            getItems: () => (0, test_1.getTestInputItems)(editor.document, initialValues, activeRange, symbolsPromise),
            buttons: [vscode.QuickInputButtons.Back],
            onDidTriggerButton: () => editInput.render(activeTitle, editInput.input.value),
            onDidHide: () => editor.setDecorations(PREVIEW_RANGE_DECORATION, []),
            onDidChangeActive: async (items) => {
                const item = items[0];
                if (item) {
                    const range = item.range instanceof vscode.Range ? item.range : await item.range();
                    previewActiveRange(range);
                }
            },
            onDidAccept: async (item) => {
                const acceptedItem = item;
                if (!acceptedItem) {
                    return;
                }
                const range = acceptedItem.range instanceof vscode.Range
                    ? acceptedItem.range
                    : await acceptedItem.range();
                updateActiveRange(range);
                // Hide the input and execute a new edit for 'Test'
                unitTestInput.input.hide();
                // TODO: This should entirely run through `executeEdit` when
                // the unit test command has fully moved over to Edit.
                return vscode.commands.executeCommand('cody.command.unit-tests');
            },
        });
        const editInput = (0, quick_pick_1.createQuickPick)({
            title: activeTitle,
            placeHolder: 'Enter edit instructions (type @ to include code, ⏎ to submit)',
            getItems: () => (0, edit_1.getEditInputItems)(editInput.input.value, activeRangeItem, activeModelItem, showModelSelector),
            onDidHide: () => editor.setDecorations(PREVIEW_RANGE_DECORATION, []),
            ...(source === 'menu'
                ? {
                    buttons: [vscode.QuickInputButtons.Back],
                    onDidTriggerButton: target => {
                        if (target === vscode.QuickInputButtons.Back) {
                            void vscode.commands.executeCommand('cody.menu.commands');
                            editInput.input.hide();
                        }
                    },
                }
                : {}),
            onDidChangeValue: async (value) => {
                const input = editInput.input;
                if (initialValues.initialInputValue !== undefined &&
                    value === initialValues.initialInputValue) {
                    // Noop, this event is fired when an initial value is set
                    return;
                }
                const isFileSearch = value.endsWith('@');
                const isSymbolSearch = value.endsWith('@#');
                // If we have the beginning of a file or symbol match, show a helpful label
                if (isFileSearch) {
                    input.items = [{ alwaysShow: true, label: constants_1.FILE_HELP_LABEL }];
                    return;
                }
                if (isSymbolSearch) {
                    input.items = [{ alwaysShow: true, label: constants_1.SYMBOL_HELP_LABEL }];
                    return;
                }
                const matchingContext = await (0, get_matching_context_1.getMatchingContext)(value);
                if (matchingContext === null) {
                    // Nothing to match, re-render existing items
                    // eslint-disable-next-line no-self-assign
                    input.items = (0, edit_1.getEditInputItems)(input.value, activeRangeItem, activeModelItem, showModelSelector).items;
                    return;
                }
                if (matchingContext.length === 0) {
                    // Attempted to match but found nothing
                    input.items = [{ alwaysShow: true, label: constants_1.NO_MATCHES_LABEL }];
                    return;
                }
                // Update stored context items so we can retrieve them later
                for (const { key, file } of matchingContext) {
                    contextItems.set(key, file);
                }
                // Add human-friendly labels to the quick pick so the user can select them
                input.items = matchingContext.map(({ key, shortLabel }) => ({
                    alwaysShow: true,
                    label: shortLabel || key,
                    description: shortLabel ? key : undefined,
                }));
            },
            onDidAccept: () => {
                const input = editInput.input;
                const instruction = input.value.trim();
                // Selected item flow, update the input and store it for submission
                const selectedItem = input.selectedItems[0];
                switch (selectedItem.label) {
                    case edit_1.MODEL_ITEM.label:
                        modelInput.render(activeTitle, '');
                        return;
                    case edit_1.RANGE_ITEM.label:
                        rangeInput.render(activeTitle, '');
                        return;
                    case edit_1.DOCUMENT_ITEM.label:
                        documentInput.render(activeTitle, '');
                        return;
                    case edit_1.TEST_ITEM.label:
                        unitTestInput.render(activeTitle, '');
                        return;
                }
                // Empty input flow, do nothing
                if (!instruction) {
                    return;
                }
                // User provided context flow, the `key` is provided as the `description` for symbol items, use this if available.
                const key = selectedItem?.description || selectedItem?.label;
                if (selectedItem) {
                    const contextItem = contextItems.get(key);
                    if (contextItem) {
                        // Replace fuzzy value with actual context in input
                        input.value = `${(0, utils_1.removeAfterLastAt)(instruction)}@${key} `;
                        selectedContextItems.set(key, contextItem);
                        return;
                    }
                }
                // Submission flow, validate selected items and return final output
                input.hide();
                textDocumentListener.dispose();
                return resolve({
                    instruction: instruction.trim(),
                    userContextFiles: Array.from(selectedContextItems)
                        .filter(([key]) => instruction.includes(`@${key}`))
                        .map(([, value]) => value),
                    model: activeModel,
                    range: activeRange,
                    intent: (0, edit_intent_1.isGenerateIntent)(document, activeRange) ? 'add' : 'edit',
                });
            },
        });
        editInput.render(activeTitle, initialValues.initialInputValue || '');
        editInput.input.activeItems = [];
    });
};
exports.getInput = getInput;
