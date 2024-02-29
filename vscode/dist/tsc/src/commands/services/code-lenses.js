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
exports.CommandCodeLenses = void 0;
const vscode = __importStar(require("vscode"));
const active_editor_1 = require("../../editor/active-editor");
const test_commands_1 = require("../utils/test-commands");
const document_sections_1 = require("../../editor/utils/document-sections");
const telemetry_1 = require("../../services/telemetry");
const telemetry_v2_1 = require("../../services/telemetry-v2");
/**
 * Adds Code lenses for triggering Command Menu
 */
class CommandCodeLenses {
    isEnabled = false;
    addTestEnabled = false;
    _disposables = [];
    _onDidChangeCodeLenses = new vscode.EventEmitter();
    onDidChangeCodeLenses = this._onDidChangeCodeLenses.event;
    constructor() {
        this.provideCodeLenses = this.provideCodeLenses.bind(this);
        this.updateConfig();
        vscode.workspace.onDidChangeConfiguration(e => {
            if (e.affectsConfiguration('cody')) {
                this.updateConfig();
            }
        });
    }
    /**
     * init
     */
    init() {
        if (!this.isEnabled) {
            return;
        }
        this._disposables.push(vscode.languages.registerCodeLensProvider({ scheme: 'file' }, this));
        this._disposables.push(vscode.commands.registerCommand('cody.editor.codelens.click', async (lens) => {
            telemetry_1.telemetryService.log('CodyVSCodeExtension:command:codelens:clicked');
            telemetry_v2_1.telemetryRecorder.recordEvent('cody.command.codelens', 'clicked');
            const clickedLens = lens;
            await this.onCodeLensClick(clickedLens);
        }));
        // on change events for toggling
        this._disposables.push(vscode.window.onDidChangeVisibleTextEditors(() => this.fire()), vscode.window.onDidChangeActiveTextEditor(() => this.fire()));
    }
    /**
     * Update the configurations
     */
    updateConfig() {
        const config = vscode.workspace.getConfiguration('cody');
        this.isEnabled = config.get('commandCodeLenses');
        this.addTestEnabled = config.get('internal.unstable');
        if (this.isEnabled && !this._disposables.length) {
            this.init();
        }
        this.fire();
    }
    /**
     * Gets the code lenses for the specified document.
     */
    async provideCodeLenses(document, token) {
        if (!this.isEnabled) {
            return [];
        }
        token.onCancellationRequested(() => []);
        const editor = (0, active_editor_1.getEditor)()?.active;
        if (editor?.document !== document || document.languageId === 'json') {
            return [];
        }
        // For test files, adds code lenses for each symbol
        if (this.addTestEnabled && (0, test_commands_1.isValidTestFile)(document.uri)) {
            return await this.provideCodeLensesForSymbols(document.uri);
        }
        const codeLenses = [];
        const linesWithLenses = new Set();
        const smartRanges = await (0, document_sections_1.getDocumentSections)(document);
        for (const range of smartRanges) {
            if (linesWithLenses.has(range.start)) {
                continue;
            }
            const selection = new vscode.Selection(range.start, range.end);
            codeLenses.push(new vscode.CodeLens(range, {
                ...commandLenses.cody,
                arguments: [{ name: 'cody.menu.commands', selection }],
            }));
            linesWithLenses.add(range.start.line);
        }
        return codeLenses;
    }
    async provideCodeLensesForSymbols(doc) {
        const codeLenses = [];
        const linesWithLenses = new Set();
        // Get a list of symbols from the document, filter out symbols that are not functions / classes / methods
        const allSymbols = await vscode.commands.executeCommand('vscode.executeDocumentSymbolProvider', doc);
        const symbols = allSymbols?.filter(symbol => symbol.kind === vscode.SymbolKind.Function ||
            symbol.kind === vscode.SymbolKind.Class ||
            symbol.kind === vscode.SymbolKind.Method ||
            symbol.kind === vscode.SymbolKind.Constructor) ?? [];
        for (const symbol of symbols) {
            const range = symbol.location.range;
            const startLine = range.start.line;
            if (linesWithLenses.has(startLine)) {
                continue;
            }
            const selection = new vscode.Selection(startLine, 0, range.end.line + 1, 0);
            codeLenses.push(new vscode.CodeLens(range, {
                ...commandLenses.test,
                arguments: [{ name: 'cody.command.tests-cases', selection }],
            }));
            linesWithLenses.add(startLine);
        }
        return codeLenses;
    }
    /**
     * Handle the code lens click event
     */
    async onCodeLensClick(lens) {
        // Update selection in active editor to the selection of the clicked code lens
        const activeEditor = (0, active_editor_1.getEditor)().active;
        if (activeEditor) {
            activeEditor.selection = lens.selection;
        }
        await vscode.commands.executeCommand(lens.name, 'codeLens');
    }
    /**
     * Fire an event to notify VS Code that the code lenses have changed.
     */
    fire() {
        if (!this.isEnabled) {
            this.dispose();
            return;
        }
        this._onDidChangeCodeLenses.fire();
    }
    /**
     * Dispose the disposables
     */
    dispose() {
        if (this._disposables.length) {
            for (const disposable of this._disposables) {
                disposable.dispose();
            }
            this._disposables = [];
        }
        this._onDidChangeCodeLenses.fire();
    }
}
exports.CommandCodeLenses = CommandCodeLenses;
const commandLenses = {
    cody: {
        title: '$(cody-logo) Cody',
        command: 'cody.editor.codelens.click',
        tooltip: 'Open command menu',
    },
    test: {
        title: '$(cody-logo) Add More Tests',
        command: 'cody.editor.codelens.click',
        tooltip: 'Generate new test cases',
    },
};
