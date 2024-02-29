"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAlmostTheSameString = void 0;
const js_levenshtein_1 = __importDefault(require("js-levenshtein"));
/**
 * Compares string by editing distance algorithm, returns true
 * whenever string are almost the same, means that strings are
 * the same if we can apply less than MAX_NUMBER_EDITS to the stringA
 * to convert it to the stringB. There are three possible types of edit
 * - Substitution
 * - Insertion
 * - Deletion
 *
 * For more details see https://en.wikipedia.org/wiki/Levenshtein_distance
 */
const isAlmostTheSameString = (stringA, stringB, percentage = 0.15) => {
    const maxLength = Math.max(stringA.length, stringB.length);
    const editOperations = (0, js_levenshtein_1.default)(stringA, stringB);
    // Strings are the same
    if (editOperations === 0) {
        return true;
    }
    const operationToLength = editOperations / maxLength;
    return percentage > operationToLength;
};
exports.isAlmostTheSameString = isAlmostTheSameString;
