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
exports.onActivationDevelopmentHelpers = void 0;
const vscode = __importStar(require("vscode"));
const log_1 = require("../log");
/**
 * A development helper that runs on activation to make the edit-debug loop easier.
 *
 * The following VS Code settings are respected. (They are not part of this extension's contributed
 * configuration JSON Schema, so they will not validate in your VS Code user settings file.)
 *
 * - `cody.dev.openAutocompleteTraceView`: boolean
 * - `cody.dev.openOutputConsole`: boolean
 */
function onActivationDevelopmentHelpers() {
    const settings = vscode.workspace.getConfiguration('cody.dev');
    if (settings.get('openAutocompleteTraceView')) {
        void vscode.commands.executeCommand('cody.autocomplete.openTraceView');
    }
    if (settings.get('openOutputConsole')) {
        log_1.outputChannel.show();
    }
}
exports.onActivationDevelopmentHelpers = onActivationDevelopmentHelpers;
