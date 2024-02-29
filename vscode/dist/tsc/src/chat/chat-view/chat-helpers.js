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
exports.viewRangeToRange = exports.getChatPanelTitle = exports.contextItemsToContextFiles = exports.stripContextWrapper = exports.contextMessageToContextItem = exports.openFile = void 0;
const vscode = __importStar(require("vscode"));
async function openFile(uri, range, currentViewColumn) {
    let viewColumn = vscode.ViewColumn.Beside;
    if (currentViewColumn) {
        viewColumn = currentViewColumn - 1 || currentViewColumn + 1;
    }
    const doc = await vscode.workspace.openTextDocument(uri);
    // +1 because selection range starts at 0 while editor line starts at 1
    const selection = range && new vscode.Range(range.start.line, 0, range.end.line + 1, 0);
    await vscode.window.showTextDocument(doc, {
        selection,
        viewColumn,
        preserveFocus: true,
        preview: true,
    });
}
exports.openFile = openFile;
// The approximate inverse of CodebaseContext.makeContextMessageWithResponse
function contextMessageToContextItem(contextMessage) {
    if (!contextMessage.text) {
        return null;
    }
    const contextText = stripContextWrapper(contextMessage.text);
    if (!contextText) {
        return null;
    }
    if (!contextMessage.file) {
        return null;
    }
    const range = contextMessage.file.range;
    return {
        text: contextText,
        uri: contextMessage.file.uri,
        source: contextMessage.file.source,
        range: range &&
            new vscode.Range(range.start.line, range.start.character, range.end.line, range.end.character),
        repoName: contextMessage.file.repoName,
        revision: contextMessage.file.revision,
        title: contextMessage.file.title,
    };
}
exports.contextMessageToContextItem = contextMessageToContextItem;
function stripContextWrapper(text) {
    {
        const start = text.indexOf("Use the following code snippet");
        if (start >= 0) {
            text = text.slice(start);
            const lines = text.split("\n");
            return lines.slice(2, -1).join("\n");
        }
    }
    {
        const start = text.indexOf("Use the following text from file");
        if (start >= 0) {
            text = text.slice(start);
            const lines = text.split("\n");
            return lines.slice(1).join("\n");
        }
    }
    {
        const start = text.indexOf("My selected ");
        const selectedStart = text.indexOf("<selected>");
        const selectedEnd = text.indexOf("</selected>");
        if (start >= 0 && selectedStart >= 0 && selectedEnd >= 0) {
            text = text.slice(selectedStart, selectedEnd);
            const lines = text.split("\n");
            return lines.slice(1, -1).join("\n");
        }
    }
    return undefined;
}
exports.stripContextWrapper = stripContextWrapper;
function contextItemsToContextFiles(items) {
    const contextFiles = [];
    for (const item of items) {
        contextFiles.push({
            type: "file", // TODO(sqs): some of these are symbols; preserve that `type`
            uri: item.uri,
            source: item.source || "embeddings",
            range: rangeToActiveTextEditorSelectionRange(item.range),
            content: item.text,
            repoName: item.repoName,
            revision: item.revision,
            title: item.title,
        });
    }
    return contextFiles;
}
exports.contextItemsToContextFiles = contextItemsToContextFiles;
function rangeToActiveTextEditorSelectionRange(range) {
    if (!range) {
        return undefined;
    }
    return {
        start: {
            line: range.start.line,
            character: range.start.character,
        },
        end: {
            line: range.end.line,
            character: range.end.character,
        },
    };
}
function getChatPanelTitle(lastDisplayText, truncateTitle = true) {
    if (!lastDisplayText) {
        return "New Chat";
    }
    // Regex to remove the markdown formatted links with this format: '[_@FILENAME_]()'
    const MARKDOWN_LINK_REGEX = /\[_(.+?)_]\((.+?)\)/g;
    lastDisplayText = lastDisplayText
        .replaceAll(MARKDOWN_LINK_REGEX, "$1")
        ?.trim();
    if (!truncateTitle) {
        return lastDisplayText;
    }
    // truncate title that is too long
    return lastDisplayText.length > 25
        ? `${lastDisplayText.slice(0, 25).trim()}...`
        : lastDisplayText;
}
exports.getChatPanelTitle = getChatPanelTitle;
function viewRangeToRange(range) {
    if (!range) {
        return undefined;
    }
    return new vscode.Range(range.start.line, range.start.character, range.end.line, range.end.character);
}
exports.viewRangeToRange = viewRangeToRange;
