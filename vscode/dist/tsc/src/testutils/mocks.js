"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_VSCODE_SETTINGS = exports.emptyMockFeatureFlagProvider = exports.MockFeatureFlagProvider = exports.ProgressLocation = exports.vsCodeMocks = exports.UIKind = exports.TextDocumentChangeReason = exports.workspaceFs = exports.CancellationTokenSource = exports.CancellationToken = exports.FileType = exports.EndOfLine = exports.InlineCompletionItem = exports.FoldingRange = exports.FoldingRangeKind = exports.Selection = exports.Range = exports.Location = exports.Position = exports.RelativePattern = exports.TreeItem = exports.QuickInputButtons = exports.CodeActionKind = exports.CodeAction = exports.ViewColumn = exports.SymbolKind = exports.DiagnosticSeverity = exports.ExtensionMode = exports.TreeItemCollapsibleState = exports.CommentMode = exports.TextEditorRevealType = exports.MarkdownString = exports.ColorThemeKind = exports.ThemeIcon = exports.ThemeColor = exports.CodeLens = exports.OverviewRulerLane = exports.CommentThreadCollapsibleState = exports.ExtensionKind = exports.LogLevel = exports.StatusBarAlignment = exports.ConfigurationTarget = exports.QuickPickItemKind = exports.InlineCompletionTriggerKind = exports.Disposable = exports.WorkspaceEdit = exports.EventEmitter = exports.Uri = void 0;
// TODO: use implements vscode.XXX on mocked classes to ensure they match the real vscode API.
const promises_1 = __importDefault(require("fs/promises"));
const cody_shared_1 = require("@sourcegraph/cody-shared");
const AgentEventEmitter_1 = require("./AgentEventEmitter");
const uri_1 = require("./uri");
var uri_2 = require("./uri");
Object.defineProperty(exports, "Uri", { enumerable: true, get: function () { return uri_2.Uri; } });
var AgentEventEmitter_2 = require("./AgentEventEmitter");
Object.defineProperty(exports, "EventEmitter", { enumerable: true, get: function () { return AgentEventEmitter_2.AgentEventEmitter; } });
var AgentWorkspaceEdit_1 = require("./AgentWorkspaceEdit");
Object.defineProperty(exports, "WorkspaceEdit", { enumerable: true, get: function () { return AgentWorkspaceEdit_1.AgentWorkspaceEdit; } });
var Disposable_1 = require("./Disposable");
Object.defineProperty(exports, "Disposable", { enumerable: true, get: function () { return Disposable_1.Disposable; } });
const AgentWorkspaceEdit_2 = require("./AgentWorkspaceEdit");
/**
 * This module defines shared VSCode mocks for use in every Vitest test.
 * Tests requiring no custom mocks will automatically apply the mocks defined in this file.
 * This is made possible via the `setupFiles` property in the Vitest configuration.
 */
var InlineCompletionTriggerKind;
(function (InlineCompletionTriggerKind) {
    // biome-ignore lint/style/useLiteralEnumMembers: want satisfies typecheck
    InlineCompletionTriggerKind[InlineCompletionTriggerKind["Invoke"] = 0] = "Invoke";
    // biome-ignore lint/style/useLiteralEnumMembers: want satisfies typecheck
    InlineCompletionTriggerKind[InlineCompletionTriggerKind["Automatic"] = 1] = "Automatic";
})(InlineCompletionTriggerKind || (exports.InlineCompletionTriggerKind = InlineCompletionTriggerKind = {}));
var QuickPickItemKind;
(function (QuickPickItemKind) {
    QuickPickItemKind[QuickPickItemKind["Separator"] = -1] = "Separator";
    QuickPickItemKind[QuickPickItemKind["Default"] = 0] = "Default";
})(QuickPickItemKind || (exports.QuickPickItemKind = QuickPickItemKind = {}));
var ConfigurationTarget;
(function (ConfigurationTarget) {
    ConfigurationTarget[ConfigurationTarget["Global"] = 1] = "Global";
    ConfigurationTarget[ConfigurationTarget["Workspace"] = 2] = "Workspace";
    ConfigurationTarget[ConfigurationTarget["WorkspaceFolder"] = 3] = "WorkspaceFolder";
})(ConfigurationTarget || (exports.ConfigurationTarget = ConfigurationTarget = {}));
var StatusBarAlignment;
(function (StatusBarAlignment) {
    StatusBarAlignment[StatusBarAlignment["Left"] = 1] = "Left";
    StatusBarAlignment[StatusBarAlignment["Right"] = 2] = "Right";
})(StatusBarAlignment || (exports.StatusBarAlignment = StatusBarAlignment = {}));
var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["Off"] = 0] = "Off";
    LogLevel[LogLevel["Trace"] = 1] = "Trace";
    LogLevel[LogLevel["Debug"] = 2] = "Debug";
    LogLevel[LogLevel["Info"] = 3] = "Info";
    LogLevel[LogLevel["Warning"] = 4] = "Warning";
    LogLevel[LogLevel["Error"] = 5] = "Error";
})(LogLevel || (exports.LogLevel = LogLevel = {}));
var ExtensionKind;
(function (ExtensionKind) {
    ExtensionKind[ExtensionKind["UI"] = 1] = "UI";
    ExtensionKind[ExtensionKind["Workspace"] = 2] = "Workspace";
})(ExtensionKind || (exports.ExtensionKind = ExtensionKind = {}));
var CommentThreadCollapsibleState;
(function (CommentThreadCollapsibleState) {
    CommentThreadCollapsibleState[CommentThreadCollapsibleState["Collapsed"] = 0] = "Collapsed";
    CommentThreadCollapsibleState[CommentThreadCollapsibleState["Expanded"] = 1] = "Expanded";
})(CommentThreadCollapsibleState || (exports.CommentThreadCollapsibleState = CommentThreadCollapsibleState = {}));
var OverviewRulerLane;
(function (OverviewRulerLane) {
    OverviewRulerLane[OverviewRulerLane["Left"] = 1] = "Left";
    OverviewRulerLane[OverviewRulerLane["Center"] = 2] = "Center";
    OverviewRulerLane[OverviewRulerLane["Right"] = 4] = "Right";
    OverviewRulerLane[OverviewRulerLane["Full"] = 7] = "Full";
})(OverviewRulerLane || (exports.OverviewRulerLane = OverviewRulerLane = {}));
class CodeLens {
    range;
    command;
    isResolved = true;
    constructor(range, command) {
        this.range = range;
        this.command = command;
    }
}
exports.CodeLens = CodeLens;
class ThemeColor {
    id;
    constructor(id) {
        this.id = id;
    }
}
exports.ThemeColor = ThemeColor;
class ThemeIcon {
    id;
    color;
    static File = new ThemeIcon('file');
    static Folder = new ThemeIcon('folder');
    constructor(id, color) {
        this.id = id;
        this.color = color;
    }
}
exports.ThemeIcon = ThemeIcon;
var ColorThemeKind;
(function (ColorThemeKind) {
    ColorThemeKind[ColorThemeKind["Light"] = 1] = "Light";
    ColorThemeKind[ColorThemeKind["Dark"] = 2] = "Dark";
    ColorThemeKind[ColorThemeKind["HighContrast"] = 3] = "HighContrast";
    ColorThemeKind[ColorThemeKind["HighContrastLight"] = 4] = "HighContrastLight";
})(ColorThemeKind || (exports.ColorThemeKind = ColorThemeKind = {}));
class MarkdownString {
    value;
    constructor(value) {
        this.value = value;
    }
    isTrusted;
    supportThemeIcons;
    supportHtml;
    baseUri;
    appendText() {
        throw new Error('Method not implemented.');
    }
    appendMarkdown() {
        throw new Error('Method not implemented.');
    }
    appendCodeblock() {
        throw new Error('Method not implemented.');
    }
}
exports.MarkdownString = MarkdownString;
var TextEditorRevealType;
(function (TextEditorRevealType) {
    TextEditorRevealType[TextEditorRevealType["Default"] = 0] = "Default";
    TextEditorRevealType[TextEditorRevealType["InCenter"] = 1] = "InCenter";
    TextEditorRevealType[TextEditorRevealType["InCenterIfOutsideViewport"] = 2] = "InCenterIfOutsideViewport";
    TextEditorRevealType[TextEditorRevealType["AtTop"] = 3] = "AtTop";
})(TextEditorRevealType || (exports.TextEditorRevealType = TextEditorRevealType = {}));
var CommentMode;
(function (CommentMode) {
    CommentMode[CommentMode["Editing"] = 0] = "Editing";
    CommentMode[CommentMode["Preview"] = 1] = "Preview";
})(CommentMode || (exports.CommentMode = CommentMode = {}));
var TreeItemCollapsibleState;
(function (TreeItemCollapsibleState) {
    TreeItemCollapsibleState[TreeItemCollapsibleState["None"] = 0] = "None";
    TreeItemCollapsibleState[TreeItemCollapsibleState["Collapsed"] = 1] = "Collapsed";
    TreeItemCollapsibleState[TreeItemCollapsibleState["Expanded"] = 2] = "Expanded";
})(TreeItemCollapsibleState || (exports.TreeItemCollapsibleState = TreeItemCollapsibleState = {}));
var ExtensionMode;
(function (ExtensionMode) {
    ExtensionMode[ExtensionMode["Production"] = 1] = "Production";
    ExtensionMode[ExtensionMode["Development"] = 2] = "Development";
    ExtensionMode[ExtensionMode["Test"] = 3] = "Test";
})(ExtensionMode || (exports.ExtensionMode = ExtensionMode = {}));
var DiagnosticSeverity;
(function (DiagnosticSeverity) {
    DiagnosticSeverity[DiagnosticSeverity["Error"] = 0] = "Error";
    DiagnosticSeverity[DiagnosticSeverity["Warning"] = 1] = "Warning";
    DiagnosticSeverity[DiagnosticSeverity["Information"] = 2] = "Information";
    DiagnosticSeverity[DiagnosticSeverity["Hint"] = 3] = "Hint";
})(DiagnosticSeverity || (exports.DiagnosticSeverity = DiagnosticSeverity = {}));
var SymbolKind;
(function (SymbolKind) {
    SymbolKind[SymbolKind["File"] = 0] = "File";
    SymbolKind[SymbolKind["Module"] = 1] = "Module";
    SymbolKind[SymbolKind["Namespace"] = 2] = "Namespace";
    SymbolKind[SymbolKind["Package"] = 3] = "Package";
    SymbolKind[SymbolKind["Class"] = 4] = "Class";
    SymbolKind[SymbolKind["Method"] = 5] = "Method";
    SymbolKind[SymbolKind["Property"] = 6] = "Property";
    SymbolKind[SymbolKind["Field"] = 7] = "Field";
    SymbolKind[SymbolKind["Constructor"] = 8] = "Constructor";
    SymbolKind[SymbolKind["Enum"] = 9] = "Enum";
    SymbolKind[SymbolKind["Interface"] = 10] = "Interface";
    SymbolKind[SymbolKind["Function"] = 11] = "Function";
    SymbolKind[SymbolKind["Variable"] = 12] = "Variable";
    SymbolKind[SymbolKind["Constant"] = 13] = "Constant";
    SymbolKind[SymbolKind["String"] = 14] = "String";
    SymbolKind[SymbolKind["Number"] = 15] = "Number";
    SymbolKind[SymbolKind["Boolean"] = 16] = "Boolean";
    SymbolKind[SymbolKind["Array"] = 17] = "Array";
    SymbolKind[SymbolKind["Object"] = 18] = "Object";
    SymbolKind[SymbolKind["Key"] = 19] = "Key";
    SymbolKind[SymbolKind["Null"] = 20] = "Null";
    SymbolKind[SymbolKind["EnumMember"] = 21] = "EnumMember";
    SymbolKind[SymbolKind["Struct"] = 22] = "Struct";
    SymbolKind[SymbolKind["Event"] = 23] = "Event";
    SymbolKind[SymbolKind["Operator"] = 24] = "Operator";
    SymbolKind[SymbolKind["TypeParameter"] = 25] = "TypeParameter";
})(SymbolKind || (exports.SymbolKind = SymbolKind = {}));
var ViewColumn;
(function (ViewColumn) {
    ViewColumn[ViewColumn["Active"] = -1] = "Active";
    ViewColumn[ViewColumn["Beside"] = -2] = "Beside";
    ViewColumn[ViewColumn["One"] = 1] = "One";
    ViewColumn[ViewColumn["Two"] = 2] = "Two";
    ViewColumn[ViewColumn["Three"] = 3] = "Three";
    ViewColumn[ViewColumn["Four"] = 4] = "Four";
    ViewColumn[ViewColumn["Five"] = 5] = "Five";
    ViewColumn[ViewColumn["Six"] = 6] = "Six";
    ViewColumn[ViewColumn["Seven"] = 7] = "Seven";
    ViewColumn[ViewColumn["Eight"] = 8] = "Eight";
    ViewColumn[ViewColumn["Nine"] = 9] = "Nine";
})(ViewColumn || (exports.ViewColumn = ViewColumn = {}));
class CodeAction {
    title;
    kind;
    edit;
    diagnostics;
    command;
    isPreferred;
    disabled;
    constructor(title, kind) {
        this.title = title;
        this.kind = kind;
    }
}
exports.CodeAction = CodeAction;
class CodeActionKind {
    value;
    static Empty = new CodeActionKind('Empty');
    static QuickFix = new CodeActionKind('');
    static Refactor = new CodeActionKind('');
    static RefactorExtract = new CodeActionKind('');
    static RefactorInline = new CodeActionKind('');
    static RefactorMove = new CodeActionKind('');
    static RefactorRewrite = new CodeActionKind('');
    static Source = new CodeActionKind('');
    static SourceOrganizeImports = new CodeActionKind('');
    static SourceFixAll = new CodeActionKind('');
    constructor(value) {
        this.value = value;
    }
}
exports.CodeActionKind = CodeActionKind;
// biome-ignore lint/complexity/noStaticOnlyClass: mock
class QuickInputButtons {
    static Back = {
        iconPath: uri_1.Uri.parse('file://foobar'),
    };
}
exports.QuickInputButtons = QuickInputButtons;
class TreeItem {
    resourceUri;
    collapsibleState;
    constructor(resourceUri, collapsibleState) {
        this.resourceUri = resourceUri;
        this.collapsibleState = collapsibleState;
    }
}
exports.TreeItem = TreeItem;
class RelativePattern {
    pattern;
    baseUri;
    base;
    constructor(_base, pattern) {
        this.pattern = pattern;
        this.baseUri =
            typeof _base === 'string'
                ? uri_1.Uri.file(_base)
                : 'uri' in _base
                    ? uri_1.Uri.from(_base.uri)
                    : uri_1.Uri.from(_base);
        this.base = _base.toString();
    }
}
exports.RelativePattern = RelativePattern;
class Position {
    line;
    character;
    constructor(line, character) {
        this.line = line;
        this.character = character;
    }
    isAfter(other) {
        return other.line < this.line || (other.line === this.line && other.character < this.character);
    }
    isAfterOrEqual(other) {
        return this.isAfter(other) || this.isEqual(other);
    }
    isBefore(other) {
        return !this.isAfterOrEqual(other);
    }
    isBeforeOrEqual(other) {
        return !this.isAfter(other);
    }
    isEqual(other) {
        return this.line === other.line && this.character === other.character;
    }
    translate(arg, characterDelta) {
        const lineDelta = typeof arg === 'number' ? arg : arg?.lineDelta;
        characterDelta = arg && typeof arg !== 'number' ? arg.characterDelta : characterDelta;
        return new Position(this.line + (lineDelta || 0), this.character + (characterDelta || 0));
    }
    with(arg, character) {
        const newLine = typeof arg === 'number' ? arg : arg?.line;
        const newCharacter = arg && typeof arg !== 'number' ? arg?.character : character;
        return new Position(newLine ?? this.line, newCharacter ?? this.character);
    }
    compareTo(other) {
        return this.isBefore(other) ? -1 : this.isAfter(other) ? 1 : 0;
    }
}
exports.Position = Position;
class Location {
    uri;
    range;
    constructor(uri, rangeOrPosition) {
        this.uri = uri;
        if ('line' in rangeOrPosition && 'character' in rangeOrPosition) {
            this.range = new Range(rangeOrPosition, rangeOrPosition);
        }
        else {
            this.range = rangeOrPosition;
        }
    }
}
exports.Location = Location;
class Range {
    start;
    end;
    constructor(startLine, startCharacter, endLine, endCharacter) {
        if (typeof startLine !== 'number' && typeof startCharacter !== 'number') {
            this.start = startLine;
            this.end = startCharacter;
        }
        else if (typeof startLine === 'number' &&
            typeof startCharacter === 'number' &&
            typeof endLine === 'number' &&
            typeof endCharacter === 'number') {
            this.start = new Position(startLine, startCharacter);
            this.end = new Position(endLine, endCharacter);
        }
        else {
            throw new TypeError('this version of the constructor is not implemented');
        }
    }
    with(arg, end) {
        const start = arg && ('start' in arg || 'end' in arg) ? arg.start : arg;
        end = arg && 'end' in arg ? arg.end : end;
        return new Range(start || this.start, end || this.end);
    }
    get startLine() {
        return this.start.line;
    }
    get startCharacter() {
        return this.start.character;
    }
    get endLine() {
        return this.end.line;
    }
    get endCharacter() {
        return this.end.character;
    }
    isEqual(other) {
        return this.start.isEqual(other.start) && this.end.isEqual(other.end);
    }
    get isEmpty() {
        return this.start.isEqual(this.end);
    }
    get isSingleLine() {
        return this.start.line === this.end.line;
    }
    contains(positionOrRange) {
        if ('line' in positionOrRange) {
            return (positionOrRange.line >= this.start.line &&
                positionOrRange.line <= this.end.line &&
                positionOrRange.character >= this.start.character &&
                positionOrRange.character <= this.end.character);
        }
        throw new Error('not implemented');
    }
    intersection() {
        throw new Error('not implemented');
    }
    union() {
        throw new Error('not implemented');
    }
}
exports.Range = Range;
class Selection extends Range {
    anchor;
    active;
    constructor(anchorLine, anchorCharacter, activeLine, activeCharacter) {
        if (typeof anchorLine === 'number' &&
            typeof anchorCharacter === 'number' &&
            typeof activeLine === 'number' &&
            typeof activeCharacter === 'number') {
            super(anchorLine, anchorCharacter, activeLine, activeCharacter);
        }
        else if (typeof anchorLine === 'object' && typeof anchorCharacter === 'object') {
            super(anchorLine, anchorCharacter);
        }
        else {
            throw new TypeError('this version of the constructor is not implemented');
        }
        this.anchor = this.start;
        this.active = this.end;
    }
    /**
     * Create a selection from four coordinates.
     * @param anchorLine A zero-based line value.
     * @param anchorCharacter A zero-based character value.
     * @param activeLine A zero-based line value.
     * @param activeCharacter A zero-based character value.
     */
    // constructor(anchorLine: number, anchorCharacter: number, activeLine: number, activeCharacter: number) {}
    /**
     * A selection is reversed if its {@link Selection.anchor anchor} is the {@link Selection.end end} position.
     */
    isReversed = false;
}
exports.Selection = Selection;
var FoldingRangeKind;
(function (FoldingRangeKind) {
    FoldingRangeKind[FoldingRangeKind["Comment"] = 1] = "Comment";
    FoldingRangeKind[FoldingRangeKind["Imports"] = 2] = "Imports";
    FoldingRangeKind[FoldingRangeKind["Region"] = 3] = "Region";
})(FoldingRangeKind || (exports.FoldingRangeKind = FoldingRangeKind = {}));
class FoldingRange {
    start;
    end;
    kind;
    constructor(start, end, kind) {
        this.start = start;
        this.end = end;
        this.kind = kind;
    }
}
exports.FoldingRange = FoldingRange;
class InlineCompletionItem {
    insertText;
    range;
    constructor(content, range) {
        this.insertText = content;
        this.range = range;
    }
}
exports.InlineCompletionItem = InlineCompletionItem;
// TODO(abeatrix): Implement delete and insert mocks
var EndOfLine;
(function (EndOfLine) {
    EndOfLine[EndOfLine["LF"] = 1] = "LF";
    EndOfLine[EndOfLine["CRLF"] = 2] = "CRLF";
})(EndOfLine || (exports.EndOfLine = EndOfLine = {}));
var FileType;
(function (FileType) {
    FileType[FileType["Unknown"] = 0] = "Unknown";
    FileType[FileType["File"] = 1] = "File";
    FileType[FileType["Directory"] = 2] = "Directory";
    FileType[FileType["SymbolicLink"] = 64] = "SymbolicLink";
})(FileType || (exports.FileType = FileType = {}));
class CancellationToken {
    isCancellationRequested = false;
    emitter = new AgentEventEmitter_1.AgentEventEmitter();
    constructor() {
        this.emitter.event(() => {
            this.isCancellationRequested = true;
        });
    }
    onCancellationRequested = this.emitter.event;
}
exports.CancellationToken = CancellationToken;
// @cody refactor
class CancellationTokenSource {
    token = new CancellationToken();
    cancel() {
        if (!this.token.isCancellationRequested) {
            this.token.emitter.fire();
        }
    }
    dispose() {
        this.token.emitter.dispose();
    }
}
exports.CancellationTokenSource = CancellationTokenSource;
exports.workspaceFs = {
    stat: async (uri) => {
        const stat = await promises_1.default.stat(uri.fsPath);
        const type = stat.isFile()
            ? FileType.File
            : stat.isDirectory()
                ? FileType.Directory
                : stat.isSymbolicLink()
                    ? FileType.SymbolicLink
                    : FileType.Unknown;
        return {
            type,
            ctime: stat.ctimeMs,
            mtime: stat.mtimeMs,
            size: stat.size,
        };
    },
    readDirectory: async (uri) => {
        const entries = await promises_1.default.readdir(uri.fsPath, {
            withFileTypes: true,
        });
        return entries.map(entry => {
            const type = entry.isFile()
                ? FileType.File
                : entry.isDirectory()
                    ? FileType.Directory
                    : entry.isSymbolicLink()
                        ? FileType.SymbolicLink
                        : FileType.Unknown;
            return [entry.name, type];
        });
    },
    createDirectory: async (uri) => {
        await promises_1.default.mkdir(uri.fsPath, { recursive: true });
    },
    readFile: async (uri) => {
        try {
            const content = await promises_1.default.readFile(uri.fsPath);
            return new Uint8Array(content.buffer);
        }
        catch (error) {
            throw new Error(`no such file: ${uri}`, { cause: error });
        }
    },
    writeFile: async (uri, content) => {
        await promises_1.default.writeFile(uri.fsPath, content);
    },
    delete: async (uri, options) => {
        await promises_1.default.rm(uri.fsPath, {
            recursive: options?.recursive ?? false,
        });
    },
    rename: async (source, target, options) => {
        if (options?.overwrite ?? false) {
            await promises_1.default.unlink(target.fsPath);
        }
        await promises_1.default.link(source.fsPath, target.fsPath);
        await promises_1.default.unlink(source.fsPath);
    },
    copy: async (source, target, options) => {
        const mode = options?.overwrite ? 0 : promises_1.default.constants.COPYFILE_EXCL;
        await promises_1.default.copyFile(source.fsPath, target.fsPath, mode);
    },
    isWritableFileSystem: scheme => {
        if (scheme === 'file') {
            return true;
        }
        return false;
    },
};
const languages = {
    // Copied from the `console.log(vscode.languages.getLanguages())` output.
    getLanguages() {
        return Promise.resolve([
            'plaintext',
            'code-text-binary',
            'Log',
            'log',
            'scminput',
            'bat',
            'clojure',
            'coffeescript',
            'jsonc',
            'json',
            'c',
            'cpp',
            'cuda-cpp',
            'csharp',
            'css',
            'dart',
            'diff',
            'dockerfile',
            'ignore',
            'fsharp',
            'git-commit',
            'git-rebase',
            'go',
            'groovy',
            'handlebars',
            'hlsl',
            'html',
            'ini',
            'properties',
            'java',
            'javascriptreact',
            'javascript',
            'jsx-tags',
            'jsonl',
            'snippets',
            'julia',
            'juliamarkdown',
            'tex',
            'latex',
            'bibtex',
            'cpp_embedded_latex',
            'markdown_latex_combined',
            'less',
            'lua',
            'makefile',
            'markdown',
            'markdown-math',
            'wat',
            'objective-c',
            'objective-cpp',
            'perl',
            'perl6',
            'php',
            'powershell',
            'jade',
            'python',
            'r',
            'razor',
            'restructuredtext',
            'ruby',
            'rust',
            'scss',
            'search-result',
            'shaderlab',
            'shellscript',
            'sql',
            'swift',
            'typescript',
            'typescriptreact',
            'vb',
            'xml',
            'xsl',
            'dockercompose',
            'yaml',
            'tailwindcss',
            'editorconfig',
            'graphql',
            'vue',
            'go.mod',
            'go.work',
            'go.sum',
            'gotmpl',
            'govulncheck',
            'kotlin',
            'kotlinscript',
            'lisp',
            'toml',
            'jinja',
            'pip-requirements',
            'raw',
            'prisma',
            'starlark',
            'bazel',
            'bazelrc',
            'vimrc',
        ]);
    },
};
var TextDocumentChangeReason;
(function (TextDocumentChangeReason) {
    TextDocumentChangeReason[TextDocumentChangeReason["Undo"] = 1] = "Undo";
    TextDocumentChangeReason[TextDocumentChangeReason["Redo"] = 2] = "Redo";
})(TextDocumentChangeReason || (exports.TextDocumentChangeReason = TextDocumentChangeReason = {}));
var UIKind;
(function (UIKind) {
    UIKind[UIKind["Desktop"] = 1] = "Desktop";
    UIKind[UIKind["Web"] = 2] = "Web";
})(UIKind || (exports.UIKind = UIKind = {}));
exports.vsCodeMocks = {
    FileType,
    Range,
    Position,
    InlineCompletionItem,
    EventEmitter: AgentEventEmitter_1.AgentEventEmitter,
    EndOfLine,
    CancellationTokenSource,
    ThemeColor,
    ThemeIcon,
    TreeItem,
    WorkspaceEdit: AgentWorkspaceEdit_2.AgentWorkspaceEdit,
    UIKind,
    QuickInputButtons,
    Uri: uri_1.Uri,
    languages,
    env: {
        uiKind: 1,
    },
    window: {
        showInformationMessage: () => undefined,
        showWarningMessage: () => undefined,
        showQuickPick: () => undefined,
        showInputBox: () => undefined,
        createOutputChannel() {
            return null;
        },
        showErrorMessage(message) {
            console.error(message);
        },
        activeTextEditor: {
            document: { uri: { scheme: 'not-cody' } },
            options: { tabSize: 4 },
        },
        onDidChangeActiveTextEditor() { },
        createTextEditorDecorationType: () => ({
            key: 'foo',
            dispose: () => { },
        }),
        visibleTextEditors: [],
        tabGroups: { all: [] },
    },
    commands: {
        registerCommand: () => ({ dispose: () => { } }),
    },
    workspace: {
        fs: exports.workspaceFs,
        getConfiguration() {
            return {
                get(key) {
                    switch (key) {
                        case 'cody.debug.filter':
                            return '.*';
                        default:
                            return '';
                    }
                },
                update() { },
            };
        },
        openTextDocument: (uri) => ({
            getText: () => 'foo\nbar\nfoo',
            save: () => true,
        }),
        applyEdit: (edit) => true,
        save: () => true,
        asRelativePath(path) {
            return path.toString();
        },
        onDidChangeTextDocument() { },
        onDidRenameFiles() { },
        onDidDeleteFiles() { },
    },
    ConfigurationTarget: {
        Global: undefined,
    },
    extensions: {
        getExtension() {
            return undefined;
        },
    },
    InlineCompletionTriggerKind,
    SymbolKind,
    FoldingRange,
    FoldingRangeKind,
    CodeActionKind,
    DiagnosticSeverity,
    ViewColumn,
};
var ProgressLocation;
(function (ProgressLocation) {
    ProgressLocation[ProgressLocation["SourceControl"] = 1] = "SourceControl";
    ProgressLocation[ProgressLocation["Window"] = 10] = "Window";
    ProgressLocation[ProgressLocation["Notification"] = 15] = "Notification";
})(ProgressLocation || (exports.ProgressLocation = ProgressLocation = {}));
class MockFeatureFlagProvider extends cody_shared_1.FeatureFlagProvider {
    enabledFlags;
    constructor(enabledFlags) {
        super(null);
        this.enabledFlags = enabledFlags;
    }
    evaluateFeatureFlag(flag) {
        return Promise.resolve(this.enabledFlags.has(flag));
    }
    getFromCache(flag) {
        return this.enabledFlags.has(flag);
    }
    syncAuthStatus() {
        return Promise.resolve();
    }
}
exports.MockFeatureFlagProvider = MockFeatureFlagProvider;
exports.emptyMockFeatureFlagProvider = new MockFeatureFlagProvider(new Set());
exports.DEFAULT_VSCODE_SETTINGS = {
    proxy: null,
    codebase: '',
    customHeaders: {},
    chatPreInstruction: '',
    useContext: 'embeddings',
    autocomplete: true,
    autocompleteLanguages: {
        '*': true,
    },
    commandCodeLenses: false,
    editorTitleCommandIcon: true,
    experimentalGuardrails: false,
    experimentalSimpleChatContext: true,
    experimentalSymfContext: true,
    experimentalTracing: false,
    codeActions: true,
    commandHints: false,
    isRunningInsideAgent: false,
    agentIDE: undefined,
    debugEnable: false,
    debugVerbose: false,
    debugFilter: null,
    telemetryLevel: 'all',
    internalUnstable: false,
    autocompleteAdvancedProvider: null,
    autocompleteAdvancedModel: null,
    autocompleteCompleteSuggestWidgetSelection: true,
    autocompleteFormatOnAccept: true,
    autocompleteDisableInsideComments: false,
    autocompleteExperimentalDynamicMultilineCompletions: false,
    autocompleteExperimentalHotStreak: false,
    autocompleteExperimentalGraphContext: null,
    autocompleteExperimentalSmartThrottle: false,
    autocompleteExperimentalOllamaOptions: {
        model: 'codellama:7b-code',
        url: 'http://localhost:11434',
    },
    autocompleteTimeouts: {
        multiline: undefined,
        singleline: undefined,
    },
    testingLocalEmbeddingsEndpoint: undefined,
    testingLocalEmbeddingsIndexLibraryPath: undefined,
    testingLocalEmbeddingsModel: undefined,
};
