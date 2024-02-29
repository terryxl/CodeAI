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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createParser = exports.resetParsersCache = exports.getParser = void 0;
const path_1 = __importDefault(require("path"));
const vscode = __importStar(require("vscode"));
const grammars_1 = require("./grammars");
const query_sdk_1 = require("./query-sdk");
const ParserImpl = require('web-tree-sitter');
/*
 * Loading wasm grammar and creation parser instance everytime we trigger
 * pre- and post-process might be a performance problem, so we create instance
 * and load language grammar only once, first time we need parser for a specific
 * language, next time we read it from this cache.
 */
const PARSERS_LOCAL_CACHE = {};
function getParser(language) {
    return PARSERS_LOCAL_CACHE[language];
}
exports.getParser = getParser;
function resetParsersCache() {
    for (const key of Object.keys(PARSERS_LOCAL_CACHE)) {
        delete PARSERS_LOCAL_CACHE[key];
    }
}
exports.resetParsersCache = resetParsersCache;
async function isRegularFile(uri) {
    try {
        const stat = await vscode.workspace.fs.stat(uri);
        return stat.type === vscode.FileType.File;
    }
    catch {
        return false;
    }
}
async function createParser(settings) {
    const { language, grammarDirectory = __dirname } = settings;
    const cachedParser = PARSERS_LOCAL_CACHE[language];
    if (cachedParser) {
        return cachedParser;
    }
    const wasmPath = path_1.default.resolve(grammarDirectory, SUPPORTED_LANGUAGES[language]);
    if (!(await isRegularFile(vscode.Uri.file(wasmPath)))) {
        return undefined;
    }
    await ParserImpl.init({ grammarDirectory });
    const parser = new ParserImpl();
    const languageGrammar = await ParserImpl.Language.load(wasmPath);
    parser.setLanguage(languageGrammar);
    PARSERS_LOCAL_CACHE[language] = parser;
    (0, query_sdk_1.initQueries)(languageGrammar, language, parser);
    return parser;
}
exports.createParser = createParser;
/**
 * Map language to wasm grammar path modules, usually we would have
 * used node bindings for grammar packages, but since VSCode editor
 * runtime doesn't support this we have to work with wasm modules.
 *
 * Note: make sure that dist folder contains these modules when you
 * run VSCode extension.
 */
const SUPPORTED_LANGUAGES = {
    [grammars_1.SupportedLanguage.JavaScript]: 'tree-sitter-javascript.wasm',
    [grammars_1.SupportedLanguage.JSX]: 'tree-sitter-javascript.wasm',
    [grammars_1.SupportedLanguage.TypeScript]: 'tree-sitter-typescript.wasm',
    [grammars_1.SupportedLanguage.TSX]: 'tree-sitter-tsx.wasm',
    [grammars_1.SupportedLanguage.Java]: 'tree-sitter-java.wasm',
    [grammars_1.SupportedLanguage.Go]: 'tree-sitter-go.wasm',
    [grammars_1.SupportedLanguage.Python]: 'tree-sitter-python.wasm',
    [grammars_1.SupportedLanguage.Dart]: 'tree-sitter-dart.wasm',
    [grammars_1.SupportedLanguage.Cpp]: 'tree-sitter-cpp.wasm',
    [grammars_1.SupportedLanguage.CSharp]: 'tree-sitter-c_sharp.wasm',
    [grammars_1.SupportedLanguage.Php]: 'tree-sitter-php.wasm',
};
