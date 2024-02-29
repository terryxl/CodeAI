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
exports.getRangeInputItems = exports.getDefaultRangeItems = void 0;
const vscode = __importStar(require("vscode"));
const utils_1 = require("./utils");
const edit_selection_1 = require("../../utils/edit-selection");
const constants_1 = require("../constants");
const constants_2 = require("./constants");
const edit_intent_1 = require("../../utils/edit-intent");
const getDefaultRangeItems = (document, initialValues) => {
    const { initialRange, initialExpandedRange, initialCursorPosition } = initialValues;
    const cursorItem = {
        ...constants_2.CURSOR_RANGE_ITEM,
        range: new vscode.Range(initialCursorPosition, initialCursorPosition),
    };
    if (initialExpandedRange) {
        // No need to show the selection (it will be the same as the expanded range)
        return [
            cursorItem,
            {
                ...constants_2.EXPANDED_RANGE_ITEM,
                range: initialExpandedRange,
            },
        ];
    }
    if ((0, edit_intent_1.isGenerateIntent)(document, initialRange)) {
        // No need to show the selection (it will be the same as the cursor position)
        return [
            cursorItem,
            {
                ...constants_2.EXPANDED_RANGE_ITEM,
                range: async () => (0, edit_selection_1.getEditSmartSelection)(document, initialRange, {
                    forceExpand: true,
                }),
            },
        ];
    }
    return [
        cursorItem,
        {
            ...constants_2.SELECTION_RANGE_ITEM,
            range: initialRange,
        },
        {
            ...constants_2.EXPANDED_RANGE_ITEM,
            range: async () => (0, edit_selection_1.getEditSmartSelection)(document, initialRange, {
                forceExpand: true,
            }),
        },
    ];
};
exports.getDefaultRangeItems = getDefaultRangeItems;
const getRangeInputItems = async (document, initialValues, activeRange, symbolsPromise) => {
    const defaultItems = (0, exports.getDefaultRangeItems)(document, initialValues).map(item => ({
        ...item,
        label: `${constants_1.QUICK_PICK_ITEM_EMPTY_INDENT_PREFIX} ${item.label}`,
    }));
    const symbols = await symbolsPromise;
    const symbolItems = symbols.filter(utils_1.symbolIsFunctionLike).map(symbol => ({
        label: `${constants_1.QUICK_PICK_ITEM_EMPTY_INDENT_PREFIX} $(symbol-method) ${symbol.name}`,
        range: symbol.range,
    }));
    const activeItem = [...defaultItems, ...symbolItems].find(item => item.range instanceof vscode.Range && item.range.isEqual(activeRange));
    if (activeItem) {
        // Update the label of the active item
        activeItem.label = activeItem.label.replace(constants_1.QUICK_PICK_ITEM_EMPTY_INDENT_PREFIX, constants_1.QUICK_PICK_ITEM_CHECKED_PREFIX);
    }
    if (!symbolItems || symbolItems.length === 0) {
        return { items: defaultItems, activeItem };
    }
    return {
        items: [
            { label: 'ranges', kind: vscode.QuickPickItemKind.Separator },
            ...defaultItems,
            { label: 'symbols', kind: vscode.QuickPickItemKind.Separator },
            ...symbolItems,
        ],
        activeItem,
    };
};
exports.getRangeInputItems = getRangeInputItems;
