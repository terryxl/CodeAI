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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnhancedContextSettings = exports.EnhancedContextEventHandlers = exports.EnhancedContextContext = exports.EnhancedContextPresentationMode = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const React = __importStar(require("react"));
const react_1 = require("@vscode/webview-ui-toolkit/react");
const classnames_1 = __importDefault(require("classnames"));
const EnhancedContext_1 = require("@sourcegraph/cody-ui/src/chat/components/EnhancedContext");
const Popup_1 = require("../Popups/Popup");
const VSCodeApi_1 = require("../utils/VSCodeApi");
const Popup_module_css_1 = __importDefault(require("../Popups/Popup.module.css"));
const EnhancedContextSettings_module_css_1 = __importDefault(require("./EnhancedContextSettings.module.css"));
var EnhancedContextPresentationMode;
(function (EnhancedContextPresentationMode) {
    // An expansive display with heterogenous providers grouped by source.
    EnhancedContextPresentationMode["Consumer"] = "consumer";
    // A compact display with remote search providers over a list of sources.
    EnhancedContextPresentationMode["Enterprise"] = "enterprise";
})(EnhancedContextPresentationMode || (exports.EnhancedContextPresentationMode = EnhancedContextPresentationMode = {}));
function defaultEnhancedContextContext() {
    return {
        groups: [],
    };
}
exports.EnhancedContextContext = React.createContext(defaultEnhancedContextContext());
exports.EnhancedContextEventHandlers = React.createContext({
    onChooseRemoteSearchRepo: () => { },
    onConsentToEmbeddings: (_) => { },
    onEnabledChange: (_) => { },
    onRemoveRemoteSearchRepo: (_) => { },
    onShouldBuildSymfIndex: (_) => { },
});
function useEnhancedContextContext() {
    return React.useContext(exports.EnhancedContextContext);
}
function useEnhancedContextEventHandlers() {
    return React.useContext(exports.EnhancedContextEventHandlers);
}
// Shortens a repository name into a more succinct--but ambiguous--display name.
function briefName(name) {
    return name.slice(name.lastIndexOf('/') + 1);
}
const CompactGroupsComponent = ({ groups, handleChoose, handleRemove }) => {
    // The compact groups component is only used for enterprise context, which
    // uses homogeneous remote search providers. Lift the providers out of the
    // groups.
    const liftedProviders = [];
    for (const group of groups) {
        const providers = group.providers.filter((provider) => provider.kind === 'search' && provider.type === 'remote');
        console.assert(providers.length === group.providers.length, 'enterprise context should only use remote search providers', JSON.stringify(group.providers));
        if (providers.length) {
            liftedProviders.push([group.displayName, providers[0]]);
        }
    }
    // Sort the providers so automatically included ones appear first, then sort
    // by name.
    liftedProviders.sort((a, b) => {
        if (a[1].inclusion === 'auto' && b[1].inclusion !== 'auto') {
            return -1;
        }
        if (b[1].inclusion === 'auto') {
            return 1;
        }
        return briefName(a[0]).localeCompare(briefName(b[0]));
    });
    return ((0, jsx_runtime_1.jsxs)("div", { className: EnhancedContextSettings_module_css_1.default.enterpriseRepoList, children: [(0, jsx_runtime_1.jsx)("h1", { children: "Repositories" }), liftedProviders.length === 0 ? ((0, jsx_runtime_1.jsx)("p", { className: EnhancedContextSettings_module_css_1.default.noReposMessage, children: "No repositories selected" })) : (liftedProviders.map(([group, provider]) => ((0, jsx_runtime_1.jsx)(CompactProviderComponent, { id: provider.id, name: group, inclusion: provider.inclusion, handleRemove: handleRemove }, provider.id)))), (0, jsx_runtime_1.jsx)(react_1.VSCodeButton, { onClick: () => handleChoose(), className: EnhancedContextSettings_module_css_1.default.chooseRepositoriesButton, children: "Choose Repositories\u2026" })] }));
};
const CompactProviderComponent = ({ id, name, inclusion, handleRemove }) => {
    return ((0, jsx_runtime_1.jsxs)("div", { className: EnhancedContextSettings_module_css_1.default.enterpriseRepoListItem, children: [(0, jsx_runtime_1.jsx)("i", { className: "codicon codicon-repo-forked", title: name }), (0, jsx_runtime_1.jsx)("span", { className: EnhancedContextSettings_module_css_1.default.repoName, title: name, children: briefName(name) }), inclusion === 'auto' ? ((0, jsx_runtime_1.jsx)("span", { className: EnhancedContextSettings_module_css_1.default.infoClose, children: (0, jsx_runtime_1.jsx)("i", { className: "codicon codicon-info", title: "Included automatically based on your workspace" }) })) : ((0, jsx_runtime_1.jsx)("button", { className: EnhancedContextSettings_module_css_1.default.infoClose, onClick: () => handleRemove(id), type: "button", title: `Remove ${briefName(name)}`, children: (0, jsx_runtime_1.jsx)("i", { className: "codicon codicon-close" }) }))] }));
};
const ContextGroupComponent = ({ group, allGroups }) => {
    // if there's a single group, we want the group name's basename
    let groupName;
    if (allGroups.length === 1) {
        const matches = group.displayName.match(/.+[/\\](.+?)$/);
        groupName = matches ? matches[1] : group.displayName;
    }
    else {
        groupName = group.displayName;
    }
    return ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsxs)("dt", { title: group.displayName, className: EnhancedContextSettings_module_css_1.default.lineBreakAll, children: [(0, jsx_runtime_1.jsx)("i", { className: "codicon codicon-folder" }), " ", groupName] }), (0, jsx_runtime_1.jsx)("dd", { children: (0, jsx_runtime_1.jsx)("ol", { className: EnhancedContextSettings_module_css_1.default.providersList, children: group.providers.map(provider => ((0, jsx_runtime_1.jsx)("li", { className: EnhancedContextSettings_module_css_1.default.providerItem, children: (0, jsx_runtime_1.jsx)(ContextProviderComponent, { provider: provider }) }, provider.kind))) }) })] }));
};
function labelFor(kind) {
    // All our context providers are single words; just convert them to title
    // case
    return kind[0].toUpperCase() + kind.slice(1);
}
const SearchIndexComponent = ({ provider, indexStatus }) => {
    const events = useEnhancedContextEventHandlers();
    const onClick = () => {
        events.onShouldBuildSymfIndex(provider);
    };
    return ((0, jsx_runtime_1.jsxs)("div", { children: [indexStatus === 'failed' ? ((0, jsx_runtime_1.jsx)(jsx_runtime_1.Fragment, { children: (0, jsx_runtime_1.jsx)("p", { className: EnhancedContextSettings_module_css_1.default.providerExplanatoryText, children: "The previous indexing attempt failed or was cancelled." }) })) : ((0, jsx_runtime_1.jsx)("p", { className: EnhancedContextSettings_module_css_1.default.providerExplanatoryText, children: "The repository's contents will be indexed locally." })), (0, jsx_runtime_1.jsx)("p", { children: (0, jsx_runtime_1.jsx)(react_1.VSCodeButton, { onClick: onClick, children: indexStatus === 'failed' ? 'Retry local index' : 'Build local index' }) })] }));
};
const EmbeddingsConsentComponent = ({ provider, }) => {
    const events = useEnhancedContextEventHandlers();
    const onClick = () => {
        events.onConsentToEmbeddings(provider);
    };
    return ((0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("p", { className: EnhancedContextSettings_module_css_1.default.providerExplanatoryText, children: "The repository's contents will be uploaded to OpenAI's Embeddings API and then stored locally." }), (0, jsx_runtime_1.jsx)("p", { children: (0, jsx_runtime_1.jsx)(react_1.VSCodeButton, { onClick: onClick, children: "Enable Embeddings" }) })] }));
};
function contextProviderState(provider) {
    switch (provider.state) {
        case 'indeterminate':
            return (0, jsx_runtime_1.jsx)(jsx_runtime_1.Fragment, {});
        case 'ready':
            return (0, jsx_runtime_1.jsx)("span", { className: EnhancedContextSettings_module_css_1.default.providerInlineState, children: "\u2014 Indexed" });
        case 'indexing':
            return (0, jsx_runtime_1.jsx)("span", { className: EnhancedContextSettings_module_css_1.default.providerInlineState, children: "\u2014 Indexing\u2026" });
        case 'unconsented':
            return (0, jsx_runtime_1.jsx)(EmbeddingsConsentComponent, { provider: provider });
        case 'no-match':
            if (provider.kind === 'embeddings') {
                // Error messages for local embeddings missing.
                switch (provider.errorReason) {
                    case 'not-a-git-repo':
                        return ((0, jsx_runtime_1.jsx)("p", { className: EnhancedContextSettings_module_css_1.default.providerExplanatoryText, children: "Folder is not a Git repository." }));
                    case 'git-repo-has-no-remote':
                        return ((0, jsx_runtime_1.jsx)("p", { className: EnhancedContextSettings_module_css_1.default.providerExplanatoryText, children: "Git repository is missing a remote origin." }));
                    default:
                        return (0, jsx_runtime_1.jsx)(jsx_runtime_1.Fragment, {});
                }
            }
            return (0, jsx_runtime_1.jsx)(jsx_runtime_1.Fragment, {});
        case 'unindexed':
            if (provider.kind === 'search') {
                return (0, jsx_runtime_1.jsx)(SearchIndexComponent, { indexStatus: "unindexed", provider: provider });
            }
            return '';
        case 'failed':
            if (provider.kind === 'search') {
                return (0, jsx_runtime_1.jsx)(SearchIndexComponent, { indexStatus: "failed", provider: provider });
            }
            return '';
        default:
            return '';
    }
}
const ContextProviderComponent = ({ provider, }) => {
    let stateIcon;
    switch (provider.state) {
        case 'indeterminate':
        case 'indexing':
            stateIcon = (0, jsx_runtime_1.jsx)("i", { className: "codicon codicon-loading codicon-modifier-spin" });
            break;
        case 'unindexed':
        case 'unconsented':
            stateIcon = (0, jsx_runtime_1.jsx)("i", { className: "codicon codicon-circle-outline" });
            break;
        case 'ready':
            stateIcon = (0, jsx_runtime_1.jsx)("i", { className: "codicon codicon-database" });
            break;
        case 'no-match':
            stateIcon = (0, jsx_runtime_1.jsx)("i", { className: "codicon codicon-circle-slash" });
            break;
        case 'failed':
            stateIcon = (0, jsx_runtime_1.jsx)("i", { className: "codicon codicon-error" });
            break;
        default:
            stateIcon = '?';
            break;
    }
    return ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsxs)("span", { className: EnhancedContextSettings_module_css_1.default.providerIconAndName, children: [stateIcon, " ", (0, jsx_runtime_1.jsx)("span", { className: EnhancedContextSettings_module_css_1.default.providerLabel, children: labelFor(provider.kind) })] }), ' ', contextProviderState(provider)] }));
};
const EnhancedContextSettings = ({ presentationMode, isOpen, setOpen, }) => {
    const events = useEnhancedContextEventHandlers();
    const context = useEnhancedContextContext();
    const [enabled, setEnabled] = React.useState((0, EnhancedContext_1.useEnhancedContextEnabled)());
    const enabledChanged = React.useCallback((event) => {
        const shouldEnable = !!event.target.checked;
        if (enabled !== shouldEnable) {
            events.onEnabledChange(shouldEnable);
            setEnabled(shouldEnable);
            // Log when a user clicks on the Enhanced Context toggle
            (0, VSCodeApi_1.getVSCodeAPI)().postMessage({
                command: 'event',
                eventName: 'CodyVSCodeExtension:useEnhancedContextToggler:clicked',
                properties: { useEnhancedContext: shouldEnable },
            });
        }
    }, [events, enabled]);
    // Handles removing a manually added remote search provider.
    const handleRemoveRemoteSearchRepo = React.useCallback((id) => {
        events.onRemoveRemoteSearchRepo(id);
    }, [events]);
    const handleChooseRemoteSearchRepo = React.useCallback(() => events.onChooseRemoteSearchRepo(), [events]);
    const hasOpenedBeforeKey = 'enhanced-context-settings.has-opened-before';
    const hasOpenedBefore = localStorage.getItem(hasOpenedBeforeKey) === 'true';
    if (isOpen && !hasOpenedBefore) {
        localStorage.setItem(hasOpenedBeforeKey, 'true');
    }
    // Can't point at and use VSCodeCheckBox type with 'ref'
    const autofocusTarget = React.useRef(null);
    React.useEffect(() => {
        if (isOpen) {
            autofocusTarget.current?.focus();
        }
    }, [isOpen]);
    // Can't point at and use VSCodeButton type with 'ref'
    const restoreFocusTarget = React.useRef(null);
    const handleDismiss = React.useCallback(() => {
        setOpen(false);
        restoreFocusTarget.current?.focus();
    }, [setOpen]);
    return ((0, jsx_runtime_1.jsx)("div", { className: (0, classnames_1.default)(Popup_module_css_1.default.popupHost), children: (0, jsx_runtime_1.jsx)(Popup_1.PopupFrame, { isOpen: isOpen, onDismiss: handleDismiss, classNames: [Popup_module_css_1.default.popupTrail, EnhancedContextSettings_module_css_1.default.popup], children: (0, jsx_runtime_1.jsxs)("div", { className: EnhancedContextSettings_module_css_1.default.container, children: [(0, jsx_runtime_1.jsx)("div", { children: (0, jsx_runtime_1.jsx)(react_1.VSCodeCheckbox, { onChange: enabledChanged, checked: enabled, id: "enhanced-context-checkbox", ref: autofocusTarget }) }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { htmlFor: "enhanced-context-checkbox", children: (0, jsx_runtime_1.jsx)("h1", { children: "Enhanced Context \u2728" }) }), (0, jsx_runtime_1.jsxs)("p", { children: ["Automatically include additional context from your codebase.", ' ', (0, jsx_runtime_1.jsx)("a", { href: "https://sourcegraph.com/docs/cody/clients/install-vscode#enhanced-context-selector", children: "Learn more" })] }), presentationMode === EnhancedContextPresentationMode.Consumer ? ((0, jsx_runtime_1.jsx)("dl", { className: EnhancedContextSettings_module_css_1.default.foldersList, children: context.groups.map(group => ((0, jsx_runtime_1.jsx)(ContextGroupComponent, { group: group, allGroups: context.groups }, group.displayName))) })) : ((0, jsx_runtime_1.jsx)(CompactGroupsComponent, { groups: context.groups, handleChoose: handleChooseRemoteSearchRepo, handleRemove: handleRemoveRemoteSearchRepo })), (0, jsx_runtime_1.jsx)("p", { className: EnhancedContextSettings_module_css_1.default.hint, children: "Tip: To include a specific file or symbol as context, type @ in the message input." })] })] }) }) }));
};
exports.EnhancedContextSettings = EnhancedContextSettings;
