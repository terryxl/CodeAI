import {
    type ContextFile,
    MAX_CURRENT_FILE_TOKENS,
    truncateText,
    logError,
    wrapInActiveSpan,
} from '@sourcegraph/cody-shared'
import { getEditor } from '../../editor/active-editor'
import * as vscode from 'vscode'

export async function getContextFileFromCurrentFile(): Promise<ContextFile[]> {
    return wrapInActiveSpan('commands.context.file', async span => {
        try {
            const editor = getEditor()
            const document = editor?.active?.document
            if (!editor?.active || !document) {
                throw new Error('No active editor')
            }

            const selection = new vscode.Selection(
                0,
                0,
                document.lineCount - 1,
                document.lineAt(document.lineCount - 1).text.length
            )

            const content = document.getText(selection)

            if (!content.trim()) {
                throw new Error('No content')
            }

            return [
                {
                    type: 'file',
                    uri: document.uri,
                    content: truncateText(content, MAX_CURRENT_FILE_TOKENS),
                    source: 'editor',
                    range: selection,
                } as ContextFile,
            ]
        } catch (error) {
            logError('getContextFileFromCurrentFile', 'failed', { verbose: error })
            return []
        }
    })
}
