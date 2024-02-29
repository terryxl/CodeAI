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
exports.getTestInputItems = exports.getDefaultTestItems = void 0;
const vscode = __importStar(require("vscode"));
const utils_1 = require("./utils");
const edit_selection_1 = require("../../utils/edit-selection");
const constants_1 = require("./constants");
const getDefaultTestItems = (document, initialValues) => {
    const { initialRange, initialExpandedRange } = initialValues;
    if (initialExpandedRange) {
        // No need to show the selection (it will be the same)
        return [
            {
                ...constants_1.EXPANDED_RANGE_ITEM,
                range: initialExpandedRange,
            },
        ];
    }
    return [
        {
            ...constants_1.SELECTION_RANGE_ITEM,
            range: initialRange,
        },
        {
            ...constants_1.EXPANDED_RANGE_ITEM,
            range: async () => (0, edit_selection_1.getEditSmartSelection)(document, initialRange, {
                forceExpand: true,
            }),
        },
    ];
};
exports.getDefaultTestItems = getDefaultTestItems;
const getTestInputItems = async (document, initialValues, activeRange, symbolsPromise) => {
    const defaultItems = (0, exports.getDefaultTestItems)(document, initialValues);
    const symbols = await symbolsPromise;
    const symbolItems = symbols
        .filter(utils_1.symbolIsFunctionLike)
        .map(symbol => ({ label: `$(symbol-method) ${symbol.name}`, range: symbol.range }));
    const wrappingSymbol = symbolItems.find(item => item.range instanceof vscode.Range && item.range.contains(initialValues.initialRange));
    const activeItem = wrappingSymbol ||
        defaultItems.find(item => item.range instanceof vscode.Range && item.range.isEqual(initialValues.initialRange));
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
exports.getTestInputItems = getTestInputItems;
