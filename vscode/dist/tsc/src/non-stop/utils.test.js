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
const vitest_1 = require("vitest");
const vscode = __importStar(require("vscode"));
const utils_1 = require("./utils");
(0, vitest_1.describe)('getMinimumDistanceToRangeBoundary', () => {
    (0, vitest_1.it)('returns start distance when position is before range', () => {
        const position = new vscode.Position(5, 0);
        const range = new vscode.Range(10, 0, 20, 0);
        const minDistance = (0, utils_1.getMinimumDistanceToRangeBoundary)(position, range);
        (0, vitest_1.expect)(minDistance).toBe(5);
    });
    (0, vitest_1.it)('returns end distance when position is after range', () => {
        const position = new vscode.Position(25, 0);
        const range = new vscode.Range(10, 0, 20, 0);
        const minDistance = (0, utils_1.getMinimumDistanceToRangeBoundary)(position, range);
        (0, vitest_1.expect)(minDistance).toBe(5);
    });
    (0, vitest_1.it)('returns smaller of start and end distances when position is in range', () => {
        const position = new vscode.Position(18, 0);
        const range = new vscode.Range(10, 0, 20, 0);
        const minDistance = (0, utils_1.getMinimumDistanceToRangeBoundary)(position, range);
        (0, vitest_1.expect)(minDistance).toBe(2);
    });
});
