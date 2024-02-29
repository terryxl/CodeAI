/// <reference path="../../../../src/fileUri.d.ts" />
import type * as vscode_types from 'vscode';
import type { Location as VSCodeLocation, Position as VSCodePosition, Range as VSCodeRange } from 'vscode';
import { FeatureFlagProvider, type FeatureFlag } from '@sourcegraph/cody-shared';
import { AgentEventEmitter as EventEmitter } from './AgentEventEmitter';
import { Uri } from './uri';
export { Uri } from './uri';
export { AgentEventEmitter as EventEmitter } from './AgentEventEmitter';
export { AgentWorkspaceEdit as WorkspaceEdit } from './AgentWorkspaceEdit';
export { Disposable } from './Disposable';
import { AgentWorkspaceEdit as WorkspaceEdit } from './AgentWorkspaceEdit';
/**
 * This module defines shared VSCode mocks for use in every Vitest test.
 * Tests requiring no custom mocks will automatically apply the mocks defined in this file.
 * This is made possible via the `setupFiles` property in the Vitest configuration.
 */
export declare enum InlineCompletionTriggerKind {
    Invoke,
    Automatic
}
export declare enum QuickPickItemKind {
    Separator = -1,
    Default = 0
}
export declare enum ConfigurationTarget {
    Global = 1,
    Workspace = 2,
    WorkspaceFolder = 3
}
export declare enum StatusBarAlignment {
    Left = 1,
    Right = 2
}
export declare enum LogLevel {
    Off = 0,
    Trace = 1,
    Debug = 2,
    Info = 3,
    Warning = 4,
    Error = 5
}
export declare enum ExtensionKind {
    UI = 1,
    Workspace = 2
}
export declare enum CommentThreadCollapsibleState {
    Collapsed = 0,
    Expanded = 1
}
export declare enum OverviewRulerLane {
    Left = 1,
    Center = 2,
    Right = 4,
    Full = 7
}
export declare class CodeLens {
    readonly range: Range;
    readonly command?: vscode_types.Command;
    readonly isResolved = true;
    constructor(range: Range, command?: vscode_types.Command);
}
export declare class ThemeColor {
    readonly id: string;
    constructor(id: string);
}
export declare class ThemeIcon {
    readonly id: string;
    readonly color?: ThemeColor;
    static readonly File: ThemeIcon;
    static readonly Folder: ThemeIcon;
    constructor(id: string, color?: ThemeColor);
}
export declare enum ColorThemeKind {
    Light = 1,
    Dark = 2,
    HighContrast = 3,
    HighContrastLight = 4
}
export declare class MarkdownString implements vscode_types.MarkdownString {
    readonly value: string;
    constructor(value: string);
    isTrusted?: boolean | {
        readonly enabledCommands: readonly string[];
    } | undefined;
    supportThemeIcons?: boolean | undefined;
    supportHtml?: boolean | undefined;
    baseUri?: vscode_types.Uri | undefined;
    appendText(): vscode_types.MarkdownString;
    appendMarkdown(): vscode_types.MarkdownString;
    appendCodeblock(): vscode_types.MarkdownString;
}
export declare enum TextEditorRevealType {
    Default = 0,
    InCenter = 1,
    InCenterIfOutsideViewport = 2,
    AtTop = 3
}
export declare enum CommentMode {
    Editing = 0,
    Preview = 1
}
export declare enum TreeItemCollapsibleState {
    None = 0,
    Collapsed = 1,
    Expanded = 2
}
export declare enum ExtensionMode {
    Production = 1,
    Development = 2,
    Test = 3
}
export declare enum DiagnosticSeverity {
    Error = 0,
    Warning = 1,
    Information = 2,
    Hint = 3
}
export declare enum SymbolKind {
    File = 0,
    Module = 1,
    Namespace = 2,
    Package = 3,
    Class = 4,
    Method = 5,
    Property = 6,
    Field = 7,
    Constructor = 8,
    Enum = 9,
    Interface = 10,
    Function = 11,
    Variable = 12,
    Constant = 13,
    String = 14,
    Number = 15,
    Boolean = 16,
    Array = 17,
    Object = 18,
    Key = 19,
    Null = 20,
    EnumMember = 21,
    Struct = 22,
    Event = 23,
    Operator = 24,
    TypeParameter = 25
}
export declare enum ViewColumn {
    Active = -1,
    Beside = -2,
    One = 1,
    Two = 2,
    Three = 3,
    Four = 4,
    Five = 5,
    Six = 6,
    Seven = 7,
    Eight = 8,
    Nine = 9
}
export declare class CodeAction {
    readonly title: string;
    readonly kind?: vscode_types.CodeActionKind;
    edit?: WorkspaceEdit;
    diagnostics?: vscode_types.Diagnostic[];
    command?: vscode_types.Command;
    isPreferred?: boolean;
    disabled?: {
        readonly reason: string;
    };
    constructor(title: string, kind?: vscode_types.CodeActionKind);
}
export declare class CodeActionKind {
    readonly value: string;
    static readonly Empty: CodeActionKind;
    static readonly QuickFix: CodeActionKind;
    static readonly Refactor: CodeActionKind;
    static readonly RefactorExtract: CodeActionKind;
    static readonly RefactorInline: CodeActionKind;
    static readonly RefactorMove: CodeActionKind;
    static readonly RefactorRewrite: CodeActionKind;
    static readonly Source: CodeActionKind;
    static readonly SourceOrganizeImports: CodeActionKind;
    static readonly SourceFixAll: CodeActionKind;
    constructor(value: string);
}
export declare class QuickInputButtons {
    static readonly Back: vscode_types.QuickInputButton;
}
export declare class TreeItem {
    readonly resourceUri: vscode_types.Uri;
    readonly collapsibleState?: TreeItemCollapsibleState;
    constructor(resourceUri: vscode_types.Uri, collapsibleState?: TreeItemCollapsibleState);
}
export declare class RelativePattern implements vscode_types.RelativePattern {
    readonly pattern: string;
    baseUri: Uri;
    base: string;
    constructor(_base: vscode_types.WorkspaceFolder | vscode_types.Uri | string, pattern: string);
}
export declare class Position implements VSCodePosition {
    line: number;
    character: number;
    constructor(line: number, character: number);
    isAfter(other: Position): boolean;
    isAfterOrEqual(other: Position): boolean;
    isBefore(other: Position): boolean;
    isBeforeOrEqual(other: Position): boolean;
    isEqual(other: Position): boolean;
    translate(change: {
        lineDelta?: number;
        characterDelta?: number;
    }): VSCodePosition;
    translate(lineDelta?: number, characterDelta?: number): VSCodePosition;
    with(line?: number, character?: number): VSCodePosition;
    with(change: {
        line?: number;
        character?: number;
    }): VSCodePosition;
    compareTo(other: VSCodePosition): number;
}
export declare class Location implements VSCodeLocation {
    readonly uri: vscode_types.Uri;
    range: VSCodeRange;
    constructor(uri: vscode_types.Uri, rangeOrPosition: VSCodeRange | VSCodePosition);
}
export declare class Range implements VSCodeRange {
    start: Position;
    end: Position;
    constructor(startLine: number | Position, startCharacter: number | Position, endLine?: number, endCharacter?: number);
    with(start?: VSCodePosition, end?: VSCodePosition): VSCodeRange;
    with(change: {
        start?: VSCodePosition;
        end?: VSCodePosition;
    }): VSCodeRange;
    get startLine(): number;
    get startCharacter(): number;
    get endLine(): number;
    get endCharacter(): number;
    isEqual(other: VSCodeRange): boolean;
    get isEmpty(): boolean;
    get isSingleLine(): boolean;
    contains(positionOrRange: Position | Range): boolean;
    intersection(): VSCodeRange | undefined;
    union(): VSCodeRange;
}
export declare class Selection extends Range {
    readonly anchor: Position;
    readonly active: Position;
    constructor(anchorLine: number | Position, anchorCharacter: number | Position, activeLine?: number, activeCharacter?: number);
    /**
     * Create a selection from four coordinates.
     * @param anchorLine A zero-based line value.
     * @param anchorCharacter A zero-based character value.
     * @param activeLine A zero-based line value.
     * @param activeCharacter A zero-based character value.
     */
    /**
     * A selection is reversed if its {@link Selection.anchor anchor} is the {@link Selection.end end} position.
     */
    isReversed: boolean;
}
export declare enum FoldingRangeKind {
    Comment = 1,
    Imports = 2,
    Region = 3
}
export declare class FoldingRange {
    start: number;
    end: number;
    kind?: FoldingRangeKind;
    constructor(start: number, end: number, kind?: FoldingRangeKind);
}
export declare class InlineCompletionItem {
    insertText: string;
    range: Range | undefined;
    constructor(content: string, range?: Range);
}
export declare enum EndOfLine {
    LF = 1,
    CRLF = 2
}
export declare enum FileType {
    Unknown = 0,
    File = 1,
    Directory = 2,
    SymbolicLink = 64
}
export declare class CancellationToken implements vscode_types.CancellationToken {
    isCancellationRequested: boolean;
    emitter: EventEmitter<void>;
    constructor();
    onCancellationRequested: vscode_types.Event<void>;
}
export declare class CancellationTokenSource implements vscode_types.CancellationTokenSource {
    token: CancellationToken;
    cancel(): void;
    dispose(): void;
}
export declare const workspaceFs: typeof vscode_types.workspace.fs;
export declare enum TextDocumentChangeReason {
    Undo = 1,
    Redo = 2
}
export declare enum UIKind {
    Desktop = 1,
    Web = 2
}
export declare const vsCodeMocks: {
    readonly FileType: typeof FileType;
    readonly Range: typeof Range;
    readonly Position: typeof Position;
    readonly InlineCompletionItem: typeof InlineCompletionItem;
    readonly EventEmitter: typeof EventEmitter;
    readonly EndOfLine: typeof EndOfLine;
    readonly CancellationTokenSource: typeof CancellationTokenSource;
    readonly ThemeColor: typeof ThemeColor;
    readonly ThemeIcon: typeof ThemeIcon;
    readonly TreeItem: typeof TreeItem;
    readonly WorkspaceEdit: typeof WorkspaceEdit;
    readonly UIKind: typeof UIKind;
    readonly QuickInputButtons: typeof QuickInputButtons;
    readonly Uri: typeof Uri;
    readonly languages: Partial<typeof vscode_types.languages>;
    readonly env: {
        readonly uiKind: 1;
    };
    readonly window: {
        readonly showInformationMessage: () => any;
        readonly showWarningMessage: () => any;
        readonly showQuickPick: () => any;
        readonly showInputBox: () => any;
        readonly createOutputChannel: () => any;
        readonly showErrorMessage: (message: string) => void;
        readonly activeTextEditor: {
            readonly document: {
                readonly uri: {
                    readonly scheme: "not-cody";
                };
            };
            readonly options: {
                readonly tabSize: 4;
            };
        };
        readonly onDidChangeActiveTextEditor: () => void;
        readonly createTextEditorDecorationType: () => {
            key: string;
            dispose: () => void;
        };
        readonly visibleTextEditors: readonly [];
        readonly tabGroups: {
            readonly all: readonly [];
        };
    };
    readonly commands: {
        readonly registerCommand: () => {
            dispose: () => void;
        };
    };
    readonly workspace: {
        readonly fs: vscode_types.FileSystem;
        readonly getConfiguration: () => {
            get(key: string): "" | ".*";
            update(): void;
        };
        readonly openTextDocument: (uri: string) => {
            getText: () => string;
            save: () => boolean;
        };
        readonly applyEdit: (edit: WorkspaceEdit) => boolean;
        readonly save: () => boolean;
        readonly asRelativePath: (path: string | vscode_types.Uri) => string;
        readonly onDidChangeTextDocument: () => void;
        readonly onDidRenameFiles: () => void;
        readonly onDidDeleteFiles: () => void;
    };
    readonly ConfigurationTarget: {
        readonly Global: any;
    };
    readonly extensions: {
        readonly getExtension: () => any;
    };
    readonly InlineCompletionTriggerKind: typeof InlineCompletionTriggerKind;
    readonly SymbolKind: typeof SymbolKind;
    readonly FoldingRange: typeof FoldingRange;
    readonly FoldingRangeKind: typeof FoldingRangeKind;
    readonly CodeActionKind: typeof CodeActionKind;
    readonly DiagnosticSeverity: typeof DiagnosticSeverity;
    readonly ViewColumn: typeof ViewColumn;
};
export declare enum ProgressLocation {
    SourceControl = 1,
    Window = 10,
    Notification = 15
}
export declare class MockFeatureFlagProvider extends FeatureFlagProvider {
    private readonly enabledFlags;
    constructor(enabledFlags: Set<FeatureFlag>);
    evaluateFeatureFlag(flag: FeatureFlag): Promise<boolean>;
    getFromCache(flag: FeatureFlag): boolean;
    syncAuthStatus(): Promise<void>;
}
export declare const emptyMockFeatureFlagProvider: MockFeatureFlagProvider;
export declare const DEFAULT_VSCODE_SETTINGS: {
    proxy: any;
    codebase: string;
    customHeaders: {};
    chatPreInstruction: string;
    useContext: "embeddings";
    autocomplete: true;
    autocompleteLanguages: {
        '*': true;
    };
    commandCodeLenses: false;
    editorTitleCommandIcon: true;
    experimentalGuardrails: false;
    experimentalSimpleChatContext: true;
    experimentalSymfContext: true;
    experimentalTracing: false;
    codeActions: true;
    commandHints: false;
    isRunningInsideAgent: false;
    agentIDE: any;
    debugEnable: false;
    debugVerbose: false;
    debugFilter: any;
    telemetryLevel: "all";
    internalUnstable: false;
    autocompleteAdvancedProvider: any;
    autocompleteAdvancedModel: any;
    autocompleteCompleteSuggestWidgetSelection: true;
    autocompleteFormatOnAccept: true;
    autocompleteDisableInsideComments: false;
    autocompleteExperimentalDynamicMultilineCompletions: false;
    autocompleteExperimentalHotStreak: false;
    autocompleteExperimentalGraphContext: any;
    autocompleteExperimentalSmartThrottle: false;
    autocompleteExperimentalOllamaOptions: {
        model: string;
        url: string;
    };
    autocompleteTimeouts: {
        multiline: any;
        singleline: any;
    };
    testingLocalEmbeddingsEndpoint: any;
    testingLocalEmbeddingsIndexLibraryPath: any;
    testingLocalEmbeddingsModel: any;
};
//# sourceMappingURL=mocks.d.ts.map