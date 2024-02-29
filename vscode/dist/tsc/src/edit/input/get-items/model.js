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
exports.getModelInputItems = exports.getModelOptionItems = exports.getModelProviderIcon = void 0;
const vscode = __importStar(require("vscode"));
const constants_1 = require("../constants");
const getModelProviderIcon = (provider) => {
    switch (provider) {
        case 'Anthropic':
            return '$(anthropic-logo)';
        case 'OpenAI':
            return '$(openai-logo)';
        case 'Mistral':
            return '$(mistral-logo)';
        default:
            return '';
    }
};
exports.getModelProviderIcon = getModelProviderIcon;
const getModelOptionItems = (modelOptions, isCodyPro) => {
    const allOptions = modelOptions.map(modelOption => {
        const icon = (0, exports.getModelProviderIcon)(modelOption.provider);
        return {
            label: `${constants_1.QUICK_PICK_ITEM_EMPTY_INDENT_PREFIX} ${icon} ${modelOption.title}`,
            description: `by ${modelOption.provider}`,
            alwaysShow: true,
            model: modelOption.model,
            modelTitle: modelOption.title,
            codyProOnly: modelOption.codyProOnly,
        };
    });
    if (!isCodyPro) {
        return [
            ...allOptions.filter(option => !option.codyProOnly),
            { label: 'upgrade to cody pro', kind: vscode.QuickPickItemKind.Separator },
            ...allOptions.filter(option => option.codyProOnly),
        ];
    }
    return allOptions;
};
exports.getModelOptionItems = getModelOptionItems;
const getModelInputItems = (modelOptions, activeModel, isCodyPro) => {
    const modelItems = (0, exports.getModelOptionItems)(modelOptions, isCodyPro);
    const activeItem = modelItems.find(item => item.model === activeModel);
    if (activeItem) {
        // Update the label of the active item
        activeItem.label = activeItem.label.replace(constants_1.QUICK_PICK_ITEM_EMPTY_INDENT_PREFIX, constants_1.QUICK_PICK_ITEM_CHECKED_PREFIX);
    }
    return {
        items: modelItems,
        activeItem,
    };
};
exports.getModelInputItems = getModelInputItems;
