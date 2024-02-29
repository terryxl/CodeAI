import * as vscode from 'vscode'
import { displayPath, type ContextFile } from '@sourcegraph/cody-shared'
import { QUICK_PICK_ITEM_CHECKED_PREFIX, QUICK_PICK_ITEM_EMPTY_INDENT_PREFIX } from './constants'

/**
 * Removes the string after the last '@' character in the given string.
 * Returns the original string if '@' is not found.
 */
export function removeAfterLastAt(str: string): string {
    const lastIndex = str.lastIndexOf('@')
    if (lastIndex === -1) {
        // Return the original string if "@" is not found
        return str
    }
    return str.slice(0, lastIndex)
}

/**
 * Returns a string representation of the given ContextFile for use in UI labels.
 * Includes the file path and an optional range or symbol specifier.
 */
export function getLabelForContextFile(file: ContextFile): string {
    const isFileType = file.type === 'file'
    const rangeLabel = file.range ? `:${file.range?.start.line}-${file.range?.end.line}` : ''
    if (isFileType) {
        return `${displayPath(file.uri)}${rangeLabel}`
    }
    return `${displayPath(file.uri)}${rangeLabel}#${file.symbolName}`
}

/**
 * Returns a string representation of the given range, formatted as "{startLine}:{endLine}".
 * If startLine and endLine are the same, returns just the line number.
 */
export function getTitleRange(range: vscode.Range): string {
    if (range.isEmpty) {
        // No selected range, return just active line
        return `${range.start.line + 1}`
    }

    const endLine = range.end.character === 0 ? range.end.line - 1 : range.end.line
    if (range.start.line === endLine) {
        // Range only encompasses a single line
        return `${range.start.line + 1}`
    }

    return `${range.start.line + 1}:${endLine + 1}`
}

/**
 * Returns the label for the given QuickPickItem, stripping any
 * prefixes used internally to track state.
 */
export function getItemLabel(item: vscode.QuickPickItem) {
    return item.label
        .replace(QUICK_PICK_ITEM_EMPTY_INDENT_PREFIX, '')
        .replace(QUICK_PICK_ITEM_CHECKED_PREFIX, '')
        .trim()
}

export async function fetchDocumentSymbols(
    document: vscode.TextDocument
): Promise<vscode.DocumentSymbol[]> {
    const symbols = await vscode.commands.executeCommand<vscode.DocumentSymbol[]>(
        'vscode.executeDocumentSymbolProvider',
        document.uri
    )
    if (!symbols) {
        return []
    }

    const flattenSymbols = (symbol: vscode.DocumentSymbol): vscode.DocumentSymbol[] => {
        return [symbol, ...symbol.children.flatMap(flattenSymbols)]
    }

    // Sort all symbols by their start position in the document
    return symbols.flatMap(flattenSymbols).sort((a, b) => a.range.start.compareTo(b.range.start))
}
