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
exports.FixupTask = void 0;
const vscode = __importStar(require("vscode"));
const utils_1 = require("./utils");
const edit_models_1 = require("../edit/utils/edit-models");
class FixupTask {
    fixupFile;
    instruction;
    userContextFiles;
    intent;
    selectionRange;
    mode;
    model;
    source;
    contextMessages;
    destinationFile;
    id;
    state_ = utils_1.CodyTaskState.idle;
    stateChanges = new vscode.EventEmitter();
    onDidStateChange = this.stateChanges.event;
    /**
     * The original text that we're working on updating. Set when we start an LLM spin.
     */
    original = '';
    /**
     * The original range that we're working on updating.
     * Used to perform an accurate retry. We cannot use `selectionRange` as that range may expand with the replacement code.
     */
    originalRange;
    /** The text of the streaming turn of the LLM, if any */
    inProgressReplacement;
    /** The text of the last completed turn of the LLM, if any */
    replacement;
    /** The error attached to the fixup, if any */
    error;
    /**
     * If text has been received from the LLM and a diff has been computed,
     * it is cached here. Diffs are recomputed lazily and may be stale.
     */
    diff;
    /** The number of times we've submitted this to the LLM. */
    spinCount = 0;
    /**
     * A callback to skip formatting.
     * We use the users' default editor formatter so it is possible that
     * they may run into an error that we can't anticipate
     */
    formattingResolver = null;
    constructor(
    /**
     * The file that will be updated by Cody with the replacement text at the end of stream
     * This is set by the FixupController when creating the task,
     * and will be updated by the FixupController for tasks using the 'new' mode
     */
    fixupFile, instruction, userContextFiles, 
    /* The intent of the edit, derived from the source of the command. */
    intent, selectionRange, 
    /* The mode indicates how code should be inserted */
    mode, model, 
    /* the source of the instruction, e.g. 'code-action', 'doc', etc */
    source, contextMessages, 
    /* The file to write the edit to. If not provided, the edit will be applied to the fixupFile. */
    destinationFile) {
        this.fixupFile = fixupFile;
        this.instruction = instruction;
        this.userContextFiles = userContextFiles;
        this.intent = intent;
        this.selectionRange = selectionRange;
        this.mode = mode;
        this.model = model;
        this.source = source;
        this.contextMessages = contextMessages;
        this.destinationFile = destinationFile;
        this.id = Date.now().toString(36).replaceAll(/\d+/g, '');
        this.instruction = instruction.replace(/^\/(edit|fix)/, '').trim();
        this.originalRange = selectionRange;
        this.model = (0, edit_models_1.getOverridenModelForIntent)(this.intent, this.model);
    }
    /**
     * Sets the task state. Checks the state transition is valid.
     */
    set state(state) {
        if (state === utils_1.CodyTaskState.error) {
            console.log(new Error().stack);
        }
        this.state_ = state;
        this.stateChanges.fire(state);
    }
    /**
     * Gets the state of the fixup task.
     *
     * @returns The current state of the fixup task.
     */
    get state() {
        return this.state_;
    }
}
exports.FixupTask = FixupTask;
