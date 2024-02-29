/// <reference path="../../../../src/fileUri.d.ts" />
import type * as vscode from 'vscode';
import type { BillingCategory, BillingProduct, ChatMessage, ModelProvider, event, CurrentUserCodySubscription } from '@sourcegraph/cody-shared';
import type { KnownKeys, KnownString, TelemetryEventMarketingTrackingInput, TelemetryEventParameters } from '@sourcegraph/telemetry';
import type { AuthStatus, ExtensionMessage, WebviewMessage } from '../chat/protocol';
import type { CompletionBookkeepingEvent } from '../completions/logger';
import type { CodyTaskState } from '../non-stop/utils';
import type { Repo } from '../context/repo-fetcher';
export type Requests = ClientRequests & ServerRequests;
export type ClientRequests = {
    initialize: [ClientInfo, ServerInfo];
    shutdown: [null, null];
    'chat/new': [null, string];
    'chat/restore': [{
        modelID: string;
        messages: ChatMessage[];
        chatID: string;
    }, string];
    'chat/models': [{
        id: string;
    }, {
        models: ModelProvider[];
    }];
    'chat/remoteRepos': [{
        id: string;
    }, {
        remoteRepos?: Repo[];
    }];
    'chat/submitMessage': [{
        id: string;
        message: WebviewMessage;
    }, ExtensionMessage];
    'chat/editMessage': [{
        id: string;
        message: WebviewMessage;
    }, ExtensionMessage];
    'commands/explain': [null, string];
    'commands/test': [null, string];
    'commands/smell': [null, string];
    'commands/custom': [{
        key: string;
    }, CustomCommandResult];
    'editCommands/test': [null, EditTask];
    'commands/document': [null, EditTask];
    'command/execute': [ExecuteCommandParams, any];
    'autocomplete/execute': [AutocompleteParams, AutocompleteResult];
    'graphql/getRepoIds': [{
        names: string[];
        first: number;
    }, {
        repos: {
            name: string;
            id: string;
        }[];
    }];
    'graphql/currentUserId': [null, string];
    'graphql/currentUserIsPro': [null, boolean];
    'featureFlags/getFeatureFlag': [{
        flagName: string;
    }, boolean | null];
    'graphql/getCurrentUserCodySubscription': [null, CurrentUserCodySubscription | null];
    /**
     * @deprecated use 'telemetry/recordEvent' instead.
     */
    'graphql/logEvent': [event, null];
    /**
     * Record telemetry events.
     */
    'telemetry/recordEvent': [TelemetryEvent, null];
    'graphql/getRepoIdIfEmbeddingExists': [{
        repoName: string;
    }, string | null];
    'graphql/getRepoId': [{
        repoName: string;
    }, string | null];
    /**
     * Checks if a given set of URLs includes a Cody ignored file.
     */
    'check/isCodyIgnoredFile': [{
        urls: string[];
    }, boolean];
    'git/codebaseName': [{
        url: string;
    }, string | null];
    'webview/didDispose': [{
        id: string;
    }, null];
    'webview/receiveMessage': [{
        id: string;
        message: WebviewMessage;
    }, null];
    'testing/progress': [{
        title: string;
    }, {
        result: string;
    }];
    'testing/networkRequests': [null, {
        requests: NetworkRequest[];
    }];
    'testing/requestErrors': [null, {
        errors: NetworkRequest[];
    }];
    'testing/closestPostData': [{
        url: string;
        postData: string;
    }, {
        closestBody: string;
    }];
    'testing/progressCancelation': [{
        title: string;
    }, {
        result: string;
    }];
    'testing/reset': [null, null];
    'extensionConfiguration/change': [ExtensionConfiguration, AuthStatus | null];
    'extensionConfiguration/status': [null, AuthStatus | null];
    'attribution/search': [
        {
            id: string;
            snippet: string;
        },
        {
            error: string | null;
            repoNames: string[];
            limitHit: boolean;
        }
    ];
};
export type ServerRequests = {
    'window/showMessage': [ShowWindowMessageParams, string | null];
    'textDocument/edit': [TextDocumentEditParams, boolean];
    'textDocument/openUntitledDocument': [UntitledTextDocument, boolean];
    'textDocument/show': [{
        uri: string;
        options?: vscode.TextDocumentShowOptions;
    }, boolean];
    'workspace/edit': [WorkspaceEditParams, boolean];
    'webview/create': [{
        id: string;
        data: any;
    }, null];
};
export type Notifications = ClientNotifications & ServerNotifications;
export type ClientNotifications = {
    initialized: [null];
    exit: [null];
    'extensionConfiguration/didChange': [ExtensionConfiguration];
    'textDocument/didOpen': [ProtocolTextDocument];
    'textDocument/didChange': [ProtocolTextDocument];
    'textDocument/didFocus': [{
        uri: string;
    }];
    'textDocument/didSave': [{
        uri: string;
    }];
    'textDocument/didClose': [ProtocolTextDocument];
    'workspace/didDeleteFiles': [DeleteFilesParams];
    'workspace/didCreateFiles': [CreateFilesParams];
    'workspace/didRenameFiles': [RenameFilesParams];
    '$/cancelRequest': [CancelParams];
    'autocomplete/clearLastCandidate': [null];
    'autocomplete/completionSuggested': [CompletionItemParams];
    'autocomplete/completionAccepted': [CompletionItemParams];
    'progress/cancel': [{
        id: string;
    }];
};
export type ServerNotifications = {
    'debug/message': [DebugMessage];
    'editTaskState/didChange': [EditTask];
    'codeLenses/display': [DisplayCodeLensParams];
    'webview/postMessage': [WebviewPostMessageParams];
    'progress/start': [ProgressStartParams];
    'progress/report': [ProgressReportParams];
    'progress/end': [{
        id: string;
    }];
};
interface CancelParams {
    id: string;
}
interface CompletionItemParams {
    completionID: string;
}
interface AutocompleteParams {
    uri: string;
    filePath?: string;
    position: Position;
    triggerKind?: 'Automatic' | 'Invoke';
    selectedCompletionInfo?: SelectedCompletionInfo;
}
interface SelectedCompletionInfo {
    readonly range: Range;
    readonly text: string;
}
export interface AutocompleteResult {
    items: AutocompleteItem[];
    /** completionEvent is not deprecated because it's used by non-editor clients like evaluate-autocomplete that need access to book-keeping data to evaluate results. */
    completionEvent?: CompletionBookkeepingEvent;
}
export interface AutocompleteItem {
    id: string;
    insertText: string;
    range: Range;
}
export interface ClientInfo {
    name: string;
    version: string;
    workspaceRootUri: string;
    /** @deprecated Use `workspaceRootUri` instead. */
    workspaceRootPath?: string;
    extensionConfiguration?: ExtensionConfiguration;
    capabilities?: ClientCapabilities;
    /**
     * Optional tracking attributes to inject into telemetry events recorded
     * by the agent.
     */
    marketingTracking?: TelemetryEventMarketingTrackingInput;
}
interface ClientCapabilities {
    completions?: 'none';
    chat?: 'none' | 'streaming';
    git?: 'none' | 'disabled';
    progressBars?: 'none' | 'enabled';
    edit?: 'none' | 'enabled';
    editWorkspace?: 'none' | 'enabled';
    untitledDocuments?: 'none' | 'enabled';
    showDocument?: 'none' | 'enabled';
    codeLenses?: 'none' | 'enabled';
    showWindowMessage?: 'notification' | 'request';
}
export interface ServerInfo {
    name: string;
    authenticated?: boolean;
    codyEnabled?: boolean;
    codyVersion?: string | null;
    authStatus?: AuthStatus;
}
export interface ExtensionConfiguration {
    serverEndpoint: string;
    proxy?: string | null;
    accessToken: string;
    customHeaders: Record<string, string>;
    /**
     * anonymousUserID is an important component of telemetry events that get
     * recorded. It is currently optional for backwards compatibility, but
     * it is strongly recommended to set this when connecting to Agent.
     */
    anonymousUserID?: string;
    autocompleteAdvancedProvider?: string;
    autocompleteAdvancedModel?: string | null;
    debug?: boolean;
    verboseDebug?: boolean;
    codebase?: string;
    /**
     * When passed, the Agent will handle recording events.
     * If not passed, client must send `graphql/logEvent` requests manually.
     * @deprecated This is only used for the legacy logEvent - use `telemetry` instead.
     */
    eventProperties?: EventProperties;
    customConfiguration?: Record<string, any>;
}
/**
 * TelemetryEvent is a JSON RPC format of the arguments to a typical
 * TelemetryEventRecorder implementation from '@sourcegraph/telemetry'.
 * This type is intended for use in the Agent RPC handler only - clients sending
 * events to the Agent should use 'newTelemetryEvent()' to create event objects,
 * which uses the same type constraints as '(TelemetryEventRecorder).recordEvent()'.
 * @param feature must be camelCase and '.'-delimited, e.g. 'myFeature.subFeature'.
 * Features should NOT include the client platform, e.g. 'vscode' - information
 * about the client is automatically attached to all events. Note that Cody
 * events MUST have provide feature 'cody' or have a feature prefixed with
 * 'cody.' to be considered Cody events.
 * @param action must be camelCase and simple, e.g. 'submit', 'failed', or
 * 'success', in the context of feature.
 * @param parameters should be as described in {@link TelemetryEventParameters}.
 */
interface TelemetryEvent {
    feature: string;
    action: string;
    parameters?: TelemetryEventParameters<{
        [key: string]: number;
    }, BillingProduct, BillingCategory>;
}
/**
 * newTelemetryEvent is a constructor for TelemetryEvent that shares the same
 * type constraints as '(TelemetryEventRecorder).recordEvent()'.
 */
export declare function newTelemetryEvent<Feature extends string, Action extends string, MetadataKey extends string>(feature: KnownString<Feature>, action: KnownString<Action>, parameters?: TelemetryEventParameters<KnownKeys<MetadataKey, {
    [key in MetadataKey]: number;
}>, BillingProduct, BillingCategory>): TelemetryEvent;
/**
 * @deprecated EventProperties are no longer referenced.
 */
interface EventProperties {
    /**
     * @deprecated Use (ExtensionConfiguration).anonymousUserID instead
     */
    anonymousUserID: string;
    /** Event prefix, like 'CodyNeovimPlugin' */
    prefix: string;
    /** Name of client, like 'NEOVIM_CODY_EXTENSION' */
    client: string;
    /** Source type enum*/
    source: 'IDEEXTENSION';
}
export interface Position {
    line: number;
    character: number;
}
export interface Range {
    start: Position;
    end: Position;
}
export interface ProtocolTextDocument {
    uri: string;
    /** @deprecated use `uri` instead. This property only exists for backwards compatibility during the migration period. */
    filePath?: string;
    content?: string;
    selection?: Range;
}
interface ExecuteCommandParams {
    command: string;
    arguments?: any[];
}
export interface DebugMessage {
    channel: string;
    message: string;
}
export interface ProgressStartParams {
    /** Unique ID for this operation. */
    id: string;
    options: ProgressOptions;
}
export interface ProgressReportParams {
    /** Unique ID for this operation. */
    id: string;
    /** (optional) Text message to display in the progress bar */
    message?: string;
    /**
     * (optional) increment to indicate how much percentage of the total
     * operation has been completed since the last report. The total % of the
     * job that is complete is the sum of all published increments. An increment
     * of 10 indicates '10%' of the progress has completed since the last
     * report. Can never be negative, and total can never exceed 100.
     */
    increment?: number;
}
interface ProgressOptions {
    /**
     * A human-readable string which will be used to describe the
     * operation.
     */
    title?: string;
    /**
     * The location at which progress should show.
     * Either `location` or `locationViewId` must be set
     */
    location?: string;
    /**
     * The location at which progress should show.
     * Either `location` or `locationViewId` must be set
     */
    locationViewId?: string;
    /**
     * Controls if a cancel button should show to allow the user to
     * cancel the long running operation.  Note that currently only
     * `ProgressLocation.Notification` is supporting to show a cancel
     * button.
     */
    cancellable?: boolean;
}
export interface WebviewPostMessageParams {
    id: string;
    message: ExtensionMessage;
}
export interface WorkspaceEditParams {
    operations: WorkspaceEditOperation[];
    metadata?: vscode.WorkspaceEditMetadata;
}
export type WorkspaceEditOperation = CreateFileOperation | RenameFileOperation | DeleteFileOperation | EditFileOperation;
export interface WriteFileOptions {
    overwrite?: boolean;
    ignoreIfExists?: boolean;
}
export interface CreateFileOperation {
    type: 'create-file';
    uri: string;
    options?: WriteFileOptions;
    textContents: string;
    metadata?: vscode.WorkspaceEditEntryMetadata;
}
export interface RenameFileOperation {
    type: 'rename-file';
    oldUri: string;
    newUri: string;
    options?: WriteFileOptions;
    metadata?: vscode.WorkspaceEditEntryMetadata;
}
export interface DeleteFileOperation {
    type: 'delete-file';
    uri: string;
    deleteOptions?: {
        readonly recursive?: boolean;
        readonly ignoreIfNotExists?: boolean;
    };
    metadata?: vscode.WorkspaceEditEntryMetadata;
}
export interface EditFileOperation {
    type: 'edit-file';
    uri: string;
    edits: TextEdit[];
}
export interface UntitledTextDocument {
    uri: string;
    content?: string;
    language?: string;
}
export interface TextDocumentEditParams {
    uri: string;
    edits: TextEdit[];
    options?: {
        undoStopBefore: boolean;
        undoStopAfter: boolean;
    };
}
export type TextEdit = ReplaceTextEdit | InsertTextEdit | DeleteTextEdit;
export interface ReplaceTextEdit {
    type: 'replace';
    range: Range;
    value: string;
    metadata?: vscode.WorkspaceEditEntryMetadata;
}
export interface InsertTextEdit {
    type: 'insert';
    position: Position;
    value: string;
    metadata?: vscode.WorkspaceEditEntryMetadata;
}
export interface DeleteTextEdit {
    type: 'delete';
    range: Range;
    metadata?: vscode.WorkspaceEditEntryMetadata;
}
export interface EditTask {
    id: string;
    state: CodyTaskState;
    error?: CodyError;
}
export interface CodyError {
    message: string;
    cause?: CodyError;
    stack?: string;
}
export interface DisplayCodeLensParams {
    uri: string;
    codeLenses: ProtocolCodeLens[];
}
export interface ProtocolCodeLens {
    range: Range;
    command?: ProtocolCommand;
    isResolved: boolean;
}
export interface ProtocolCommand {
    title: {
        text: string;
        icons: {
            value: string;
            position: number;
        }[];
    };
    command: string;
    tooltip?: string;
    arguments?: any[];
}
export interface NetworkRequest {
    url: string;
    body?: string;
    error?: string;
}
export interface ShowWindowMessageParams {
    severity: 'error' | 'warning' | 'information';
    message: string;
    options?: vscode.MessageOptions;
    items?: string[];
}
interface FileIdentifier {
    uri: string;
}
export interface DeleteFilesParams {
    files: FileIdentifier[];
}
export interface CreateFilesParams {
    files: FileIdentifier[];
}
interface RenameFile {
    oldUri: string;
    newUri: string;
}
export interface RenameFilesParams {
    files: RenameFile[];
}
export type CustomCommandResult = CustomChatCommandResult | CustomEditCommandResult;
export interface CustomChatCommandResult {
    type: 'chat';
    chatResult: string;
}
export interface CustomEditCommandResult {
    type: 'edit';
    editResult: EditTask;
}
export {};
//# sourceMappingURL=agent-protocol.d.ts.map