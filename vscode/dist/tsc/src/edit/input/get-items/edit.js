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
exports.getEditInputItems = exports.TEST_ITEM = exports.DOCUMENT_ITEM = exports.MODEL_ITEM = exports.RANGE_ITEM = void 0;
const vscode = __importStar(require("vscode"));
const utils_1 = require("../utils");
exports.RANGE_ITEM = {
    label: 'Range',
    alwaysShow: true,
};
exports.MODEL_ITEM = {
    label: 'Model',
    alwaysShow: true,
};
exports.DOCUMENT_ITEM = {
    label: 'Document Code...',
    detail: 'Add code documentation',
    alwaysShow: true,
};
exports.TEST_ITEM = {
    label: 'Generate Tests...',
    detail: 'Generate unit tests',
    alwaysShow: true,
};
const SUBMIT_SEPARATOR = {
    label: 'submit',
    kind: vscode.QuickPickItemKind.Separator,
};
const SUBMIT_ITEM = {
    label: 'Submit',
    detail: 'Submit edit instruction (or type @ to include code)',
    alwaysShow: true,
};
const getEditInputItems = (activeValue, activeRangeItem, activeModelItem, showModelSelector) => {
    const hasActiveValue = activeValue.trim().length > 0;
    const submitItems = hasActiveValue ? [SUBMIT_SEPARATOR, SUBMIT_ITEM] : [];
    const commandItems = hasActiveValue
        ? []
        : [
            {
                label: 'edit commands',
                kind: vscode.QuickPickItemKind.Separator,
            },
            exports.DOCUMENT_ITEM,
            exports.TEST_ITEM,
        ];
    const editItems = [
        {
            label: 'edit options',
            kind: vscode.QuickPickItemKind.Separator,
        },
        { ...exports.RANGE_ITEM, detail: (0, utils_1.getItemLabel)(activeRangeItem) },
        showModelSelector
            ? { ...exports.MODEL_ITEM, detail: activeModelItem ? (0, utils_1.getItemLabel)(activeModelItem) : undefined }
            : null,
    ];
    const items = [...submitItems, ...editItems, ...commandItems].filter(Boolean);
    return { items };
};
exports.getEditInputItems = getEditInputItems;
