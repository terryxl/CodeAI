"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatMatches = exports.initTreeSitterSDK = exports.initTreeSitterParser = void 0;
const path_1 = __importDefault(require("path"));
const grammars_1 = require("./grammars");
const parser_1 = require("./parser");
const query_sdk_1 = require("./query-sdk");
const CUSTOM_WASM_LANGUAGE_DIR = path_1.default.join(__dirname, '../../resources/wasm');
/**
 * Should be used in tests only.
 */
function initTreeSitterParser(language = grammars_1.SupportedLanguage.TypeScript) {
    return (0, parser_1.createParser)({
        language,
        grammarDirectory: CUSTOM_WASM_LANGUAGE_DIR,
    });
}
exports.initTreeSitterParser = initTreeSitterParser;
/**
 * Should be used in tests only.
 */
async function initTreeSitterSDK(language = grammars_1.SupportedLanguage.TypeScript) {
    await initTreeSitterParser(language);
    const sdk = (0, query_sdk_1.getDocumentQuerySDK)(language);
    if (!sdk) {
        throw new Error('Document query SDK is not initialized');
    }
    return sdk;
}
exports.initTreeSitterSDK = initTreeSitterSDK;
function formatMatches(matches) {
    return matches.map(({ pattern, captures }) => ({
        pattern,
        captures: formatCaptures(captures),
    }));
}
exports.formatMatches = formatMatches;
function formatCaptures(captures) {
    return captures.map(capture => ({
        name: capture.name,
        text: capture.node.text,
        start: capture.node.startPosition,
        end: capture.node.endPosition,
    }));
}
