"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.App = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
require("./App.css");
const cody_shared_1 = require("@sourcegraph/cody-shared");
const EnhancedContext_1 = require("@sourcegraph/cody-ui/src/chat/components/EnhancedContext");
const Chat_1 = require("./Chat");
const EnhancedContextSettings_1 = require("./Components/EnhancedContextSettings");
const LoadingPage_1 = require("./LoadingPage");
const Notices_1 = require("./Notices");
const OnboardingExperiment_1 = require("./OnboardingExperiment");
const displayPathEnvInfo_1 = require("./utils/displayPathEnvInfo");
const telemetry_1 = require("./utils/telemetry");
const App = ({ vscodeAPI }) => {
    const [config, setConfig] = (0, react_1.useState)(null);
    const [view, setView] = (0, react_1.useState)();
    // If the current webview is active (vs user is working in another editor tab)
    const [isWebviewActive, setIsWebviewActive] = (0, react_1.useState)(true);
    const [messageInProgress, setMessageInProgress] = (0, react_1.useState)(null);
    const [messageBeingEdited, setMessageBeingEdited] = (0, react_1.useState)(undefined);
    const [transcript, setTranscript] = (0, react_1.useState)([]);
    const [authStatus, setAuthStatus] = (0, react_1.useState)(null);
    const [userAccountInfo, setUserAccountInfo] = (0, react_1.useState)({
        isDotComUser: true,
        isCodyProUser: false,
    });
    const [formInput, setFormInput] = (0, react_1.useState)('');
    const [inputHistory, setInputHistory] = (0, react_1.useState)([]);
    const [userHistory, setUserHistory] = (0, react_1.useState)([]);
    const [chatIDHistory, setChatIDHistory] = (0, react_1.useState)([]);
    const [contextSelection, setContextSelection] = (0, react_1.useState)(null);
    const [errorMessages, setErrorMessages] = (0, react_1.useState)([]);
    const [isTranscriptError, setIsTranscriptError] = (0, react_1.useState)(false);
    const [chatModels, setChatModels] = (0, react_1.useState)();
    const [chatEnabled, setChatEnabled] = (0, react_1.useState)(true);
    const [attributionEnabled, setAttributionEnabled] = (0, react_1.useState)(false);
    const [enhancedContextEnabled, setEnhancedContextEnabled] = (0, react_1.useState)(true);
    const [enhancedContextStatus, setEnhancedContextStatus] = (0, react_1.useState)({
        groups: [],
    });
    const onChooseRemoteSearchRepo = (0, react_1.useCallback)(() => {
        vscodeAPI.postMessage({ command: 'context/choose-remote-search-repo' });
    }, [vscodeAPI]);
    const onRemoveRemoteSearchRepo = (0, react_1.useCallback)((id) => {
        vscodeAPI.postMessage({ command: 'context/remove-remote-search-repo', repoId: id });
    }, [vscodeAPI]);
    const onConsentToEmbeddings = (0, react_1.useCallback)(() => {
        vscodeAPI.postMessage({ command: 'embeddings/index' });
    }, [vscodeAPI]);
    const onShouldBuildSymfIndex = (0, react_1.useCallback)(() => {
        vscodeAPI.postMessage({ command: 'symf/index' });
    }, [vscodeAPI]);
    const guardrails = (0, react_1.useMemo)(() => {
        return new cody_shared_1.GuardrailsPost((snippet) => {
            vscodeAPI.postMessage({
                command: 'attribution-search',
                snippet,
            });
        });
    }, [vscodeAPI]);
    // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally refresh on `view`
    (0, react_1.useEffect)(() => vscodeAPI.onMessage(message => {
        switch (message.type) {
            case 'transcript': {
                if (message.isMessageInProgress) {
                    const msgLength = message.messages.length - 1;
                    setTranscript(message.messages.slice(0, msgLength));
                    setMessageInProgress(message.messages[msgLength]);
                    setIsTranscriptError(false);
                }
                else {
                    setTranscript(message.messages);
                    setMessageInProgress(null);
                }
                setChatIDHistory([...chatIDHistory, message.chatID]);
                vscodeAPI.setState(message.chatID);
                break;
            }
            case 'config':
                setConfig(message.config);
                setAuthStatus(message.authStatus);
                setUserAccountInfo({
                    isCodyProUser: !message.authStatus.userCanUpgrade,
                    // Receive this value from the extension backend to make it work
                    // with E2E tests where change the DOTCOM_URL via the env variable TESTING_DOTCOM_URL.
                    isDotComUser: message.authStatus.isDotCom,
                });
                setView(message.authStatus.isLoggedIn ? 'chat' : 'login');
                (0, displayPathEnvInfo_1.updateDisplayPathEnvInfoForWebview)(message.workspaceFolderUris);
                // Get chat models
                if (message.authStatus.isLoggedIn) {
                    vscodeAPI.postMessage({ command: 'get-chat-models' });
                }
                break;
            case 'setConfigFeatures':
                setChatEnabled(message.configFeatures.chat);
                setAttributionEnabled(message.configFeatures.attribution);
                break;
            case 'history':
                setInputHistory(message.localHistory?.input ?? []);
                setUserHistory(Object.values(message.localHistory?.chat ?? {}));
                break;
            case 'enhanced-context':
                setEnhancedContextStatus(message.enhancedContextStatus);
                break;
            case 'userContextFiles':
                setContextSelection(message.userContextFiles);
                break;
            case 'errors':
                setErrorMessages([...errorMessages, message.errors].slice(-5));
                break;
            case 'view':
                setView(message.view);
                break;
            case 'webview-state':
                setIsWebviewActive(message.isActive);
                break;
            case 'transcript-errors':
                setIsTranscriptError(message.isTranscriptError);
                break;
            case 'chatModels':
                setChatModels(message.models);
                break;
            case 'attribution':
                if (message.attribution) {
                    guardrails.notifyAttributionSuccess(message.snippet, {
                        repositories: message.attribution.repositoryNames.map(name => {
                            return { name };
                        }),
                        limitHit: message.attribution.limitHit,
                    });
                }
                if (message.error) {
                    guardrails.notifyAttributionFailure(message.snippet, new Error(message.error));
                }
                break;
        }
    }), [errorMessages, view, vscodeAPI, guardrails]);
    (0, react_1.useEffect)(() => {
        // Notify the extension host that we are ready to receive events
        vscodeAPI.postMessage({ command: 'ready' });
    }, [vscodeAPI]);
    (0, react_1.useEffect)(() => {
        if (!view) {
            vscodeAPI.postMessage({ command: 'initialized' });
        }
    }, [view, vscodeAPI]);
    const loginRedirect = (0, react_1.useCallback)((method) => {
        // We do not change the view here. We want to keep presenting the
        // login buttons until we get a token so users don't get stuck if
        // they close the browser during an auth flow.
        vscodeAPI.postMessage({
            command: 'auth',
            authKind: 'simplified-onboarding',
            authMethod: method,
        });
    }, [vscodeAPI]);
    const telemetryService = (0, react_1.useMemo)(() => (0, telemetry_1.createWebviewTelemetryService)(vscodeAPI), [vscodeAPI]);
    if (!view || !authStatus || !config) {
        return (0, jsx_runtime_1.jsx)(LoadingPage_1.LoadingPage, {});
    }
    return ((0, jsx_runtime_1.jsx)("div", { className: "outer-container", children: view === 'login' || !authStatus.isLoggedIn ? ((0, jsx_runtime_1.jsx)(OnboardingExperiment_1.LoginSimplified, { simplifiedLoginRedirect: loginRedirect, telemetryService: telemetryService, uiKindIsWeb: config?.uiKindIsWeb, vscodeAPI: vscodeAPI })) : ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)(Notices_1.Notices, { probablyNewInstall: !userHistory.filter(chat => chat.interactions.length)?.length }), errorMessages && ((0, jsx_runtime_1.jsx)(ErrorBanner, { errors: errorMessages, setErrors: setErrorMessages })), view === 'chat' && ((0, jsx_runtime_1.jsx)(EnhancedContextSettings_1.EnhancedContextEventHandlers.Provider, { value: {
                        onChooseRemoteSearchRepo,
                        onConsentToEmbeddings,
                        onEnabledChange: (enabled) => {
                            if (enabled !== enhancedContextEnabled) {
                                setEnhancedContextEnabled(enabled);
                            }
                        },
                        onRemoveRemoteSearchRepo,
                        onShouldBuildSymfIndex,
                    }, children: (0, jsx_runtime_1.jsx)(EnhancedContextSettings_1.EnhancedContextContext.Provider, { value: enhancedContextStatus, children: (0, jsx_runtime_1.jsx)(EnhancedContext_1.EnhancedContextEnabled.Provider, { value: enhancedContextEnabled, children: (0, jsx_runtime_1.jsx)(Chat_1.Chat, { chatEnabled: chatEnabled, userInfo: userAccountInfo, messageInProgress: messageInProgress, messageBeingEdited: messageBeingEdited, setMessageBeingEdited: setMessageBeingEdited, transcript: transcript, contextSelection: contextSelection, setContextSelection: setContextSelection, formInput: formInput, setFormInput: setFormInput, inputHistory: inputHistory, setInputHistory: setInputHistory, vscodeAPI: vscodeAPI, telemetryService: telemetryService, isTranscriptError: isTranscriptError, chatModels: chatModels, setChatModels: setChatModels, welcomeMessage: getWelcomeMessageByOS(config?.os), guardrails: attributionEnabled ? guardrails : undefined, chatIDHistory: chatIDHistory, isWebviewActive: isWebviewActive }) }) }) }))] })) }));
};
exports.App = App;
const ErrorBanner = ({ errors, setErrors }) => ((0, jsx_runtime_1.jsx)("div", { className: "error-container", children: errors.map((error, i) => (
    // biome-ignore lint/suspicious/noArrayIndexKey: error strings might not be unique, so we have no natural id
    (0, jsx_runtime_1.jsxs)("div", { className: "error", children: [(0, jsx_runtime_1.jsx)("span", { children: error }), (0, jsx_runtime_1.jsx)("button", { type: "button", className: "close-btn", onClick: () => setErrors(errors.filter(e => e !== error)), children: "\u00D7" })] }, i))) }));
function getWelcomeMessageByOS(os) {
    const welcomeMessageMarkdown = `欢迎! 开始编写代码，我将为您自动完成行和整个函数。

To run [Cody Commands](command:cody.menu.commands) use the keyboard shortcut <span class="keyboard-shortcut"><span>${os === 'darwin' ? '⌥' : 'Alt'}</span><span>C</span></span>, the <span class="cody-icons">A</span> button, or right-click anywhere in your code.

You can start a new chat at any time with <span class="keyboard-shortcut"><span>${os === 'darwin' ? '⌥' : 'Alt'}</span><span>/</span></span> or using the <span class="cody-icons">H</span> button.
`;
    return welcomeMessageMarkdown;
}
