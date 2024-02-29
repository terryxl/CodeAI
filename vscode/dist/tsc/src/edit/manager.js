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
exports.EditManager = void 0;
const vscode = __importStar(require("vscode"));
const cody_shared_1 = require("@sourcegraph/cody-shared");
const active_editor_1 = require("../editor/active-editor");
const FixupController_1 = require("../non-stop/FixupController");
const provider_1 = require("./provider");
const edit_selection_1 = require("./utils/edit-selection");
const constants_1 = require("./constants");
const models_1 = require("../models");
const edit_models_1 = require("./utils/edit-models");
const edit_intent_1 = require("./utils/edit-intent");
const telemetry_1 = require("../services/telemetry");
const telemetry_v2_1 = require("../services/telemetry-v2");
class EditManager {
    options;
    controller;
    disposables = [];
    editProviders = new Map();
    models = [];
    constructor(options) {
        this.options = options;
        this.models = (0, edit_models_1.getEditModelsForUser)(options.authProvider.getAuthStatus());
        this.controller = new FixupController_1.FixupController(options.authProvider);
        this.disposables.push(this.controller, vscode.commands.registerCommand('cody.command.edit-code', (args) => this.executeEdit(args)));
    }
    syncAuthStatus(authStatus) {
        this.models = (0, edit_models_1.getEditModelsForUser)(authStatus);
    }
    async executeEdit(args = {}) {
        const { configuration = {}, 
        /**
         * Note: Source must default to `editor` as these are
         * editor actions that cannot provide executeEdit `args`.
         * E.g. triggering this command via the command palette, right-click menus
         **/
        source = 'editor', } = args;
        const configFeatures = await cody_shared_1.ConfigFeaturesSingleton.getInstance().getConfigFeatures();
        if (!configFeatures.commands) {
            void vscode.window.showErrorMessage('This feature has been disabled by your Sourcegraph site admin.');
            return;
        }
        const editor = (0, active_editor_1.getEditor)();
        if (editor.ignored) {
            void vscode.window.showInformationMessage('Cannot edit Cody ignored file.');
            return;
        }
        const document = configuration.document || editor.active?.document;
        if (!document) {
            void vscode.window.showErrorMessage('Please open a file before running a command.');
            return;
        }
        const proposedRange = configuration.range || editor.active?.selection;
        if (!proposedRange) {
            return;
        }
        // Set default edit configuration, if not provided
        // It is possible that these values may be overriden later, e.g. if the user changes them in the edit input.
        const range = (0, edit_selection_1.getEditLineSelection)(document, proposedRange);
        const mode = configuration.mode || constants_1.DEFAULT_EDIT_MODE;
        const model = configuration.model || models_1.editModel.get(this.options.authProvider, this.models);
        const intent = (0, edit_intent_1.getEditIntent)(document, range, configuration.intent);
        let expandedRange;
        // Support expanding the selection range for intents where it is useful
        if (intent !== 'add') {
            const smartRange = await (0, edit_selection_1.getEditSmartSelection)(document, range, {}, intent);
            if (!smartRange.isEqual(range)) {
                expandedRange = smartRange;
            }
        }
        let task;
        if (configuration.instruction?.trim()) {
            task = await this.controller.createTask(document, configuration.instruction, configuration.userContextFiles ?? [], expandedRange || range, intent, mode, model, source, configuration.contextMessages, configuration.destinationFile);
        }
        else {
            task = await this.controller.promptUserForTask(document, range, expandedRange, mode, model, intent, configuration.contextMessages || [], source);
        }
        if (!task) {
            return;
        }
        // Log the default edit command name for doc intent or test mode
        const isDocCommand = configuration.intent === 'doc' ? 'doc' : undefined;
        const isUnitTestCommand = configuration.intent === 'test' ? 'test' : undefined;
        const eventName = isDocCommand ?? isUnitTestCommand ?? 'edit';
        telemetry_1.telemetryService.log(`CodyVSCodeExtension:command:${eventName}:executed`, { source }, { hasV2Event: true });
        telemetry_v2_1.telemetryRecorder.recordEvent(`cody.command.${eventName}`, 'executed', {
            privateMetadata: { source },
        });
        const provider = this.getProviderForTask(task);
        await provider.startEdit();
        return task;
    }
    getProviderForTask(task) {
        let provider = this.editProviders.get(task);
        if (!provider) {
            provider = new provider_1.EditProvider({ task, controller: this.controller, ...this.options });
            this.editProviders.set(task, provider);
        }
        return provider;
    }
    removeProviderForTask(task) {
        const provider = this.editProviders.get(task);
        if (provider) {
            this.editProviders.delete(task);
        }
    }
    dispose() {
        for (const disposable of this.disposables) {
            disposable.dispose();
        }
        this.disposables = [];
    }
}
exports.EditManager = EditManager;
