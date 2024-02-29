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
exports.registerSidebarCommands = void 0;
const vscode = __importStar(require("vscode"));
const protocol_1 = require("../chat/protocol");
const telemetry_1 = require("../services/telemetry");
const telemetry_v2_1 = require("../services/telemetry-v2");
const release_1 = require("../release");
const version_1 = require("../version");
function registerSidebarCommands() {
    function logSidebarClick(feature) {
        telemetry_1.telemetryService.log(`CodyVSCodeExtension:sidebar:${feature}:clicked`, undefined, {
            hasV2Event: true,
        });
        telemetry_v2_1.telemetryRecorder.recordEvent(`cody.sidebar.${feature}`, 'clicked');
    }
    return [
        vscode.commands.registerCommand('cody.show-page', (page) => {
            logSidebarClick(page);
            let url;
            switch (page) {
                case 'upgrade':
                    url = protocol_1.ACCOUNT_UPGRADE_URL;
                    break;
                case 'usage':
                    url = protocol_1.ACCOUNT_USAGE_URL;
                    break;
                case 'rate-limits':
                    url = protocol_1.ACCOUNT_LIMITS_INFO_URL;
                    break;
                default:
                    console.warn(`Unable to show unknown page: "${page}"`);
                    return;
            }
            void vscode.env.openExternal(vscode.Uri.parse(url.toString()));
        }),
        vscode.commands.registerCommand('cody.sidebar.settings', () => {
            logSidebarClick('settings');
            void vscode.commands.executeCommand('cody.status-bar.interacted');
        }),
        vscode.commands.registerCommand('cody.sidebar.keyboardShortcuts', () => {
            logSidebarClick('keyboardShortcuts');
            void vscode.commands.executeCommand('workbench.action.openGlobalKeybindings', '@ext:sourcegraph.cody-ai');
        }),
        vscode.commands.registerCommand('cody.sidebar.releaseNotes', () => {
            logSidebarClick('releaseNotes');
            void vscode.commands.executeCommand('vscode.open', (0, release_1.releaseNotesURL)(version_1.version));
        }),
        vscode.commands.registerCommand('cody.sidebar.documentation', () => {
            logSidebarClick('documentation');
            void vscode.commands.executeCommand('vscode.open', protocol_1.CODY_DOC_URL.href);
        }),
        vscode.commands.registerCommand('cody.sidebar.feedback', () => {
            logSidebarClick('feedback');
            void vscode.commands.executeCommand('vscode.open', protocol_1.CODY_FEEDBACK_URL.href);
        }),
        vscode.commands.registerCommand('cody.sidebar.discord', () => {
            logSidebarClick('discord');
            void vscode.commands.executeCommand('vscode.open', protocol_1.DISCORD_URL.href);
        }),
        vscode.commands.registerCommand('cody.sidebar.account', () => {
            logSidebarClick('account');
            void vscode.commands.executeCommand('cody.auth.account');
        }),
    ];
}
exports.registerSidebarCommands = registerSidebarCommands;
