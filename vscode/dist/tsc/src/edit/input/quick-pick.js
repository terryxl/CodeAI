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
exports.createQuickPick = void 0;
const vscode = __importStar(require("vscode"));
const createQuickPick = ({ title, placeHolder, onDidAccept, onDidChangeActive, onDidChangeValue, onDidHide, onDidTriggerButton, getItems, buttons, value = '', }) => {
    const quickPick = vscode.window.createQuickPick();
    quickPick.title = title;
    quickPick.placeholder = placeHolder;
    quickPick.value = value;
    quickPick.onDidAccept(() => onDidAccept(quickPick.activeItems[0]));
    quickPick.sortByLabel = false;
    if (onDidChangeActive) {
        quickPick.onDidChangeActive(onDidChangeActive);
    }
    if (onDidChangeValue) {
        quickPick.onDidChangeValue(onDidChangeValue);
    }
    if (onDidHide) {
        quickPick.onDidHide(onDidHide);
    }
    if (buttons && onDidTriggerButton) {
        quickPick.buttons = buttons;
        quickPick.onDidTriggerButton(onDidTriggerButton);
    }
    quickPick.matchOnDescription = false;
    quickPick.matchOnDetail = false;
    return {
        input: quickPick,
        render: (title, value) => {
            quickPick.title = title;
            quickPick.value = value;
            const itemsOrPromise = getItems();
            if (itemsOrPromise instanceof Promise) {
                quickPick.busy = true;
                itemsOrPromise.then(({ items, activeItem }) => {
                    quickPick.items = items;
                    if (activeItem) {
                        quickPick.activeItems = [activeItem];
                    }
                    quickPick.busy = false;
                });
            }
            else {
                quickPick.items = itemsOrPromise.items;
                if (itemsOrPromise.activeItem) {
                    quickPick.activeItems = [itemsOrPromise.activeItem];
                }
            }
            quickPick.show();
        },
    };
};
exports.createQuickPick = createQuickPick;
