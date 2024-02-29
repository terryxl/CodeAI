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
exports.showFeedbackSupportQuickPick = exports.FeedbackOptionItems = void 0;
const vscode = __importStar(require("vscode"));
const protocol_1 = require("../chat/protocol");
exports.FeedbackOptionItems = [
    {
        label: '$(feedback) Cody Feedback',
        async onSelect() {
            await vscode.env.openExternal(vscode.Uri.parse(protocol_1.CODY_FEEDBACK_URL.href));
        },
    },
    {
        label: '$(remote-explorer-documentation) Cody Documentation',
        async onSelect() {
            await vscode.env.openExternal(vscode.Uri.parse(protocol_1.CODY_DOC_URL.href));
        },
    },
    {
        label: '$(organization) Cody Discord Channel',
        async onSelect() {
            await vscode.env.openExternal(vscode.Uri.parse(protocol_1.DISCORD_URL.href));
        },
    },
];
const FeedbackQuickPickOptions = { title: 'Cody Feedback & Support', placeholder: 'Choose an option' };
const showFeedbackSupportQuickPick = async () => {
    const selectedItem = await vscode.window.showQuickPick(exports.FeedbackOptionItems, FeedbackQuickPickOptions);
    await selectedItem?.onSelect();
};
exports.showFeedbackSupportQuickPick = showFeedbackSupportQuickPick;
