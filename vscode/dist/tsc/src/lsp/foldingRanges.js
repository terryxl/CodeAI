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
exports.IndentationBasedFoldingRangeProvider = void 0;
const cody_shared_1 = require("@sourcegraph/cody-shared");
const vscode = __importStar(require("vscode"));
/**
 * A custom implementation of folding ranges that works with all programming
 * languages by following indentation levels.
 *
 * See agent/src/lsp/foldingRanges.test.ts for test cases. The tests live in the
 * agent/ project so that it has access to the mocked out VS Code APIs.
 */
class IndentationBasedFoldingRangeProvider {
    indentationLevel(text) {
        let indentation = 0;
        for (const c of text) {
            if (c === ' ' || c === '\t') {
                indentation++;
            }
            else {
                return indentation;
            }
        }
        return indentation;
    }
    provideFoldingRanges(document, _context, _token) {
        const result = [];
        try {
            const stack = [];
            let previousIndentation = 0;
            for (let i = 0; i < document.lineCount; i++) {
                const line = document.lineAt(i);
                let indentation = this.indentationLevel(line.text);
                if (indentation === 0) {
                    indentation = previousIndentation;
                }
                if (indentation > previousIndentation) {
                    stack.push({ startLine: Math.max(0, i - 1), indentationLevel: indentation });
                }
                else if (indentation < previousIndentation) {
                    const start = stack.pop();
                    if (start) {
                        result.push(new vscode.FoldingRange(start.startLine, i));
                    }
                }
                previousIndentation = indentation;
            }
            const start = stack.pop();
            if (start) {
                result.push(new vscode.FoldingRange(start.startLine, document.lineCount));
            }
        }
        catch (error) {
            (0, cody_shared_1.logError)('IndentationBasedFoldingRanges', 'error', error);
        }
        return result;
    }
}
exports.IndentationBasedFoldingRangeProvider = IndentationBasedFoldingRangeProvider;
