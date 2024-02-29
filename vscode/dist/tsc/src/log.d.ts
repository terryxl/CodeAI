/// <reference path="../../../src/fileUri.d.ts" />
import * as vscode from 'vscode';
import type { CompletionLogger } from '@sourcegraph/cody-shared';
export declare const outputChannel: vscode.OutputChannel;
/**
 * Logs a debug message to the "Cody by Sourcegraph" output channel.
 *
 * Usage:
 *
 *   logDebug('label', 'this is a message')
 *   logDebug('label', 'this is a message', 'some', 'args')
 *   logDebug('label', 'this is a message', 'some', 'args', { verbose: 'verbose info goes here' })
 */
export declare function logDebug(filterLabel: string, text: string, ...args: unknown[]): void;
/**
 * Logs an error message to the "Cody by Sourcegraph" output channel.
 *
 * Usage:
 *
 *   logError('label', 'this is an error')
 *   logError('label', 'this is an error', 'some', 'args')
 *   logError('label', 'this is an error', 'some', 'args', { verbose: 'verbose info goes here' })
 */
export declare function logError(filterLabel: string, text: string, ...args: unknown[]): void;
export declare const logger: CompletionLogger;
//# sourceMappingURL=log.d.ts.map