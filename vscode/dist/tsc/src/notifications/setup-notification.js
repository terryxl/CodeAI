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
exports.showSetupNotification = void 0;
const vscode = __importStar(require("vscode"));
const LocalStorageProvider_1 = require("../services/LocalStorageProvider");
const _1 = require(".");
const showSetupNotification = async (config) => {
    if (config.serverEndpoint && config.accessToken) {
        // User has already attempted to configure Cody.
        // Regardless of if they are authenticated or not, we don't want to prompt them.
        return;
    }
    if (LocalStorageProvider_1.localStorage.get('notification.setupDismissed') === 'true') {
        // User has clicked "Do not show again" on this notification.
        return;
    }
    if (LocalStorageProvider_1.localStorage.get('extension.hasActivatedPreviously') !== 'true') {
        // User is on first activation, so has only just installed Cody.
        // Show Cody so that they can get started.
        await vscode.commands.executeCommand('cody.focus');
        return;
    }
    return (0, _1.showActionNotification)({
        message: 'Continue setting up Cody',
        actions: [
            {
                label: 'Setup',
                onClick: () => vscode.commands.executeCommand('cody.focus'),
            },
            {
                label: 'Do not show again',
                onClick: () => LocalStorageProvider_1.localStorage.set('notification.setupDismissed', 'true'),
            },
        ],
    });
};
exports.showSetupNotification = showSetupNotification;
