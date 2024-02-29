import path from 'path'

import fuzzysort from 'fuzzysort'
import throttle from 'lodash/throttle'
import * as vscode from 'vscode'

import {
    displayPath,
    isCodyIgnoredFile,
    isWindows,
    type ContextFile,
    type ContextFileFile,
    type ContextFileSource,
    type ContextFileSymbol,
    type ContextFileType,
    type SymbolKind,
    MAX_CURRENT_FILE_TOKENS,
} from '@sourcegraph/cody-shared'

import { getOpenTabsUris, getWorkspaceSymbols } from '.'
import { CHARS_PER_TOKEN } from '@sourcegraph/cody-shared/src/prompt/constants'

const findWorkspaceFiles = async (
    cancellationToken: vscode.CancellationToken
): Promise<vscode.Uri[]> => {
    // TODO(toolmantim): Add support for the search.exclude option, e.g.
    // Object.keys(vscode.workspace.getConfiguration().get('search.exclude',
    // {}))
    const fileExcludesPattern =
        '**/{*.env,.git/,.class,out/,dist/,build/,snap,node_modules/,__pycache__/}**'
    // TODO(toolmantim): Check this performs with remote workspaces (do we need a UI spinner etc?)
    return vscode.workspace.findFiles('', fileExcludesPattern, undefined, cancellationToken)
}

// Some matches we don't want to ignore because they might be valid code (for example `bin/` in Dart)
// but could also be junk (`bin/` in .NET). If a file path contains a segment matching any of these
// items it will be ranked low unless the users query contains the exact segment.
const lowScoringPathSegments = ['bin']

// This is expensive for large repos (e.g. Chromium), so we only do it max once
// every 10 seconds. It also handily supports a cancellation callback to use
// with the cancellation token to discard old requests.
const throttledFindFiles = throttle(findWorkspaceFiles, 10000)

/**
 * Searches all workspaces for files matching the given string. VS Code doesn't
 * provide an API for fuzzy file searching, only precise globs, so we recreate
 * it by getting a list of all files across all workspaces and using fuzzysort.
 */
export async function getFileContextFiles(
    query: string,
    maxResults: number,
    token: vscode.CancellationToken
): Promise<ContextFileFile[]> {
    if (!query.trim()) {
        return []
    }
    token.onCancellationRequested(() => {
        throttledFindFiles.cancel()
    })

    const uris = await throttledFindFiles(token)

    if (!uris) {
        return []
    }

    if (isWindows()) {
        // On Windows, if the user has typed forward slashes, map them to backslashes before
        // running the search so they match the real paths.
        query = query.replaceAll('/', '\\')
    }

    // Add on the relative URIs for search, so we only search the visible part
    // of the path and not the full FS path.
    const urisWithRelative = uris.map(uri => ({ uri, relative: displayPath(uri) }))
    const results = fuzzysort.go(query, urisWithRelative, {
        key: 'relative',
        limit: maxResults,
        // We add a threshold for performance as per fuzzysort’s
        // recommendations. Testing with sg/sg path strings, somewhere over 10k
        // threshold is where it seems to return results that make no sense. VS
        // Code’s own fuzzy finder seems to cap out much higher. To be safer and
        // to account for longer paths from even deeper source trees we use
        // 100k. We may want to revisit this number if we get reports of missing
        // file results from very large repos.
        threshold: -100000,
    })

    // Apply a penalty for segments that are in the low scoring list.
    const adjustedResults = [...results].map(result => {
        const segments = result.obj.uri.fsPath.split(path.sep)
        for (const lowScoringPathSegment of lowScoringPathSegments) {
            if (segments.includes(lowScoringPathSegment) && !query.includes(lowScoringPathSegment)) {
                return {
                    ...result,
                    score: result.score - 100000,
                }
            }
        }
        return result
    })
    // fuzzysort can return results in different order for the same query if
    // they have the same score :( So we do this hacky post-limit sorting (first
    // by score, then by path) to ensure the order stays the same.
    const sortedResults = adjustedResults
        .sort((a, b) => {
            return (
                b.score - a.score ||
                new Intl.Collator(undefined, { numeric: true }).compare(a.obj.uri.path, b.obj.uri.path)
            )
        })
        .flatMap(result => createContextFileFromUri(result.obj.uri, 'user', 'file'))

    // TODO(toolmantim): Add fuzzysort.highlight data to the result so we can show it in the UI

    const filtered = []
    try {
        for (const sorted of sortedResults) {
            // Remove file larger than 1MB and non-text files
            // NOTE: Sourcegraph search only includes files up to 1MB
            const fileStat = await vscode.workspace.fs.stat(sorted.uri)
            if (fileStat.type !== vscode.FileType.File || fileStat.size > 1000000) {
                continue
            }
            // Check if file contains more characters than the token limit based on fileStat.size
            // and set the title of the result as 'large-file' for webview to display file size
            // warning.
            if (fileStat.size > CHARS_PER_TOKEN * MAX_CURRENT_FILE_TOKENS) {
                sorted.title = 'large-file'
            }
            filtered.push(sorted)
        }
    } catch (error) {
        console.log('atMention:getFileContextFiles:failed', error)
    }

    return filtered
}

export async function getSymbolContextFiles(
    query: string,
    maxResults = 20
): Promise<ContextFileSymbol[]> {
    if (!query.trim()) {
        return []
    }

    const queryResults = await getWorkspaceSymbols(query) // doesn't support cancellation tokens :(

    const relevantQueryResults = queryResults?.filter(
        symbol =>
            (symbol.kind === vscode.SymbolKind.Function ||
                symbol.kind === vscode.SymbolKind.Method ||
                symbol.kind === vscode.SymbolKind.Class ||
                symbol.kind === vscode.SymbolKind.Interface ||
                symbol.kind === vscode.SymbolKind.Enum ||
                symbol.kind === vscode.SymbolKind.Struct ||
                symbol.kind === vscode.SymbolKind.Constant ||
                // in TS an export const is considered a variable
                symbol.kind === vscode.SymbolKind.Variable) &&
            // TODO(toolmantim): Remove once https://github.com/microsoft/vscode/pull/192798 is in use (test: do a symbol search and check no symbols exist from node_modules)
            !symbol.location?.uri?.fsPath.includes('node_modules/')
    )

    const results = fuzzysort.go(query, relevantQueryResults, {
        key: 'name',
        limit: maxResults,
    })

    // TODO(toolmantim): Add fuzzysort.highlight data to the result so we can show it in the UI

    const symbols = results.map(result => result.obj)

    if (!symbols.length) {
        return []
    }

    const matches = []
    for (const symbol of symbols) {
        const contextFile = createContextFileFromUri(
            symbol.location.uri,
            'user',
            'symbol',
            symbol.location.range,
            // TODO(toolmantim): Update the kinds to match above
            symbol.kind === vscode.SymbolKind.Class ? 'class' : 'function',
            symbol.name
        )
        matches.push(contextFile)
    }

    return matches.flatMap(match => match)
}

export function getOpenTabsContextFile(): ContextFile[] {
    // de-dupe by fspath in case if they have a file open in two tabs
    const fsPaths = new Set()
    return getOpenTabsUris()
        .filter(uri => {
            if (isCodyIgnoredFile(uri)) {
                return false
            }
            if (!fsPaths.has(uri.path)) {
                fsPaths.add(uri.path)
                return true
            }
            return false
        })
        .flatMap(uri => createContextFileFromUri(uri, 'user', 'file'))
}

function createContextFileFromUri(
    uri: vscode.Uri,
    source: ContextFileSource,
    type: 'symbol',
    selectionRange: vscode.Range,
    kind: SymbolKind,
    symbolName: string
): ContextFileSymbol[]
function createContextFileFromUri(
    uri: vscode.Uri,
    source: ContextFileSource,
    type: 'file',
    selectionRange?: vscode.Range
): ContextFileFile[]
function createContextFileFromUri(
    uri: vscode.Uri,
    source: ContextFileSource,
    type: ContextFileType,
    selectionRange?: vscode.Range,
    kind?: SymbolKind,
    symbolName?: string
): ContextFile[] {
    if (isCodyIgnoredFile(uri)) {
        return []
    }

    const range = selectionRange ? createContextFileRange(selectionRange) : selectionRange
    return [
        type === 'file'
            ? {
                  type,
                  uri,
                  range,
                  source,
              }
            : {
                  type,
                  symbolName: symbolName!,
                  uri,
                  range,
                  source,
                  kind: kind!,
              },
    ]
}

function createContextFileRange(selectionRange: vscode.Range): ContextFile['range'] {
    return {
        start: {
            line: selectionRange.start.line,
            character: selectionRange.start.character,
        },
        end: {
            line: selectionRange.end.line,
            character: selectionRange.end.character,
        },
    }
}
