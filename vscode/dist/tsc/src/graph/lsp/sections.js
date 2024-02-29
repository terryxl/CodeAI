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
exports.getGraphDocumentSections = void 0;
const vscode = __importStar(require("vscode"));
const document_sections_1 = require("../../editor/utils/document-sections");
const languages_1 = require("./languages");
/**
 * Creates a top level map of a document's sections based on symbol ranges
 *
 * TODO(philipp-spiess): We need advanced heuristics here so that for very large sections we can
 * divide them into subsections.
 */
async function getGraphDocumentSections(document) {
    const label = 'build document symbols map';
    performance.mark(label);
    const ranges = await (0, document_sections_1.getDocumentSections)(document);
    const sections = [];
    for (const range of ranges) {
        sections.push({
            fuzzyName: extractFuzzyName(document, range),
            location: new vscode.Location(document.uri, range),
        });
    }
    performance.mark(label);
    return sections;
}
exports.getGraphDocumentSections = getGraphDocumentSections;
function extractFuzzyName(document, range) {
    const content = document.getText(range);
    for (const match of content.matchAll(languages_1.identifierPattern)) {
        if (match.index === undefined || languages_1.commonKeywords.has(match[0])) {
            continue;
        }
        return match[0];
    }
    return null;
}
