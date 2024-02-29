/// <reference path="../../../../src/fileUri.d.ts" />
import * as vscode from 'vscode';
import type { ChatMessage } from '@sourcegraph/cody-shared';
import type { ExtensionApi } from '../../src/extension-api';
/**
 * Setup (`beforeEach`) function for integration tests that need Cody configured and activated.
 */
export declare function beforeIntegrationTest(): Promise<void>;
/**
 * Teardown (`afterEach`) function for integration tests that use {@link beforeIntegrationTest}.
 */
export declare function afterIntegrationTest(): Promise<void>;
export declare function ensureExecuteCommand<T>(command: string, ...args: any[]): Promise<T>;
export declare function waitUntil(predicate: () => Promise<boolean>): Promise<void>;
export declare function getExtensionAPI(): vscode.Extension<ExtensionApi>;
export declare function getTranscript(index: number): Promise<ChatMessage>;
export declare function getTextEditorWithSelection(): Promise<void>;
export declare function getTestDocWithCursor(): Promise<void>;
/**
 * For testing only. Return a platform-native absolute path for a filename. Tests should almost
 * always use this instead of {@link URI.file}. Only use {@link URI.file} directly if the test is
 * platform-specific.
 *
 * For macOS/Linux, it returns `/file`. For Windows, it returns `C:\file`.
 * @param relativePath The name/relative path of the file (with forward slashes).
 *
 * NOTE: Copied from @sourcegraph/cody-shared because the test module can't require it (because it's
 * ESM).
 */
export declare function testFileUri(relativePath: string): vscode.Uri;
//# sourceMappingURL=helpers.d.ts.map