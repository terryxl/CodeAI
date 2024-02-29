"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getParseLanguage = exports.SupportedLanguage = void 0;
/**
 * List of all supported languages that we have grammars and
 * lexems for. Note that enum values are copied from VSCode API,
 * if we want to make it work with different editors we should
 * enhance language detection.
 *
 * TODO: Decouple language detect to make it editor agnostic
 */
var SupportedLanguage;
(function (SupportedLanguage) {
    SupportedLanguage["JavaScript"] = "javascript";
    SupportedLanguage["JSX"] = "javascriptreact";
    SupportedLanguage["TypeScript"] = "typescript";
    SupportedLanguage["TSX"] = "typescriptreact";
    SupportedLanguage["Java"] = "java";
    SupportedLanguage["Go"] = "go";
    SupportedLanguage["Python"] = "python";
    SupportedLanguage["Dart"] = "dart";
    SupportedLanguage["Cpp"] = "cpp";
    SupportedLanguage["CSharp"] = "csharp";
    SupportedLanguage["Php"] = "php";
})(SupportedLanguage || (exports.SupportedLanguage = SupportedLanguage = {}));
const getParseLanguage = (languageId) => {
    const matchedLang = Object.entries(SupportedLanguage).find(([key, value]) => value === languageId);
    return matchedLang ? languageId : null;
};
exports.getParseLanguage = getParseLanguage;
