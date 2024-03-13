"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Chat = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const react_2 = require("@vscode/webview-ui-toolkit/react");
const classnames_1 = __importDefault(require("classnames"));
const Chat_1 = require("@sourcegraph/cody-ui/src/Chat");
const EnhancedContext_1 = require("@sourcegraph/cody-ui/src/chat/components/EnhancedContext");
const protocol_1 = require("../src/chat/protocol");
const ChatModelDropdownMenu_1 = require("./Components/ChatModelDropdownMenu");
const EnhancedContextSettings_1 = require("./Components/EnhancedContextSettings");
const FileLink_1 = require("./Components/FileLink");
const SymbolLink_1 = require("./SymbolLink");
const UserContextSelector_1 = require("./UserContextSelector");
const VSCodeApi_1 = require("./utils/VSCodeApi");
const Chat_module_css_1 = __importDefault(require("./Chat.module.css"));
const Chat = ({ welcomeMessage, messageInProgress, messageBeingEdited, setMessageBeingEdited, transcript, formInput, setFormInput, inputHistory, setInputHistory, vscodeAPI, telemetryService, isTranscriptError, contextSelection, setContextSelection, setChatModels, chatModels, chatEnabled, userInfo, guardrails, chatIDHistory, isWebviewActive, }) => {
    const abortMessageInProgress = (0, react_1.useCallback)(() => {
        vscodeAPI.postMessage({ command: 'abort' });
    }, [vscodeAPI]);
    const addEnhancedContext = (0, EnhancedContext_1.useEnhancedContextEnabled)();
    const onEditSubmit = (0, react_1.useCallback)((text, index, contextFiles) => {
        vscodeAPI.postMessage({
            command: 'edit',
            index,
            text,
            addEnhancedContext,
            contextFiles,
        });
    }, [addEnhancedContext, vscodeAPI]);
    const onSubmit = (0, react_1.useCallback)((text, submitType, contextFiles) => {
        // loop the added contextFiles to:
        // 1. check if the key still exists in the text
        // 2. remove the ones not present
        const userContextFiles = [];
        if (contextFiles?.size) {
            for (const [fileName, contextFile] of contextFiles) {
                if (text.includes(fileName)) {
                    userContextFiles.push(contextFile);
                }
            }
        }
        // Handle edit requests
        if (submitType === 'edit') {
            if (messageBeingEdited !== undefined) {
                onEditSubmit(text, messageBeingEdited, userContextFiles);
            }
            return;
        }
        vscodeAPI.postMessage({
            command: 'submit',
            submitType,
            text,
            addEnhancedContext,
            contextFiles: userContextFiles,
        });
    }, [addEnhancedContext, messageBeingEdited, onEditSubmit, vscodeAPI]);
    const onCurrentChatModelChange = (0, react_1.useCallback)((selected) => {
        if (!chatModels || !setChatModels) {
            return;
        }
        vscodeAPI.postMessage({
            command: 'chatModel',
            model: selected.model,
        });
        const updatedChatModels = chatModels.map(m => m.model === selected.model ? { ...m, default: true } : { ...m, default: false });
        setChatModels(updatedChatModels);
    }, [chatModels, setChatModels, vscodeAPI]);
    const onFeedbackBtnClick = (0, react_1.useCallback)((text) => {
        const eventData = {
            value: text,
            lastChatUsedEmbeddings: Boolean(transcript.at(-1)?.contextFiles?.some(file => file.source === 'embeddings')),
            transcript: '',
        };
        if (userInfo.isDotComUser) {
            eventData.transcript = JSON.stringify(transcript);
        }
        telemetryService.log(`CodyVSCodeExtension:codyFeedback:${text}`, eventData);
    }, [telemetryService, transcript, userInfo]);
    const onCopyBtnClick = (0, react_1.useCallback)((text, eventType = 'Button', metadata) => {
        const op = 'copy';
        // remove the additional /n added by the text area at the end of the text
        const code = eventType === 'Button' ? text.replace(/\n$/, '') : text;
        // Log the event type and text to telemetry in chat view
        vscodeAPI.postMessage({
            command: op,
            eventType,
            text: code,
            metadata,
        });
    }, [vscodeAPI]);
    const onInsertBtnClick = (0, react_1.useCallback)((text, newFile = false, metadata) => {
        const op = newFile ? 'newFile' : 'insert';
        const eventType = 'Button';
        // remove the additional /n added by the text area at the end of the text
        const code = eventType === 'Button' ? text.replace(/\n$/, '') : text;
        // Log the event type and text to telemetry in chat view
        vscodeAPI.postMessage({
            command: op,
            eventType,
            text: code,
            metadata,
        });
    }, [vscodeAPI]);
    return ((0, jsx_runtime_1.jsx)(Chat_1.Chat, { messageInProgress: messageInProgress, messageBeingEdited: messageBeingEdited, setMessageBeingEdited: setMessageBeingEdited, transcript: transcript, formInput: formInput, setFormInput: setFormInput, inputHistory: inputHistory, setInputHistory: setInputHistory, onSubmit: onSubmit, textAreaComponent: TextArea, submitButtonComponent: SubmitButton, fileLinkComponent: FileLink_1.FileLink, symbolLinkComponent: SymbolLink_1.SymbolLink, className: Chat_module_css_1.default.innerContainer, codeBlocksCopyButtonClassName: Chat_module_css_1.default.codeBlocksCopyButton, codeBlocksInsertButtonClassName: Chat_module_css_1.default.codeBlocksInsertButton, transcriptItemClassName: Chat_module_css_1.default.transcriptItem, humanTranscriptItemClassName: Chat_module_css_1.default.humanTranscriptItem, transcriptItemParticipantClassName: Chat_module_css_1.default.transcriptItemParticipant, transcriptActionClassName: Chat_module_css_1.default.transcriptAction, inputRowClassName: Chat_module_css_1.default.inputRow, chatInputClassName: Chat_module_css_1.default.chatInputClassName, EditButtonContainer: EditButton, FeedbackButtonsContainer: FeedbackButtons, feedbackButtonsOnSubmit: onFeedbackBtnClick, copyButtonOnSubmit: onCopyBtnClick, insertButtonOnSubmit: onInsertBtnClick, onAbortMessageInProgress: abortMessageInProgress, isTranscriptError: isTranscriptError, 
        // TODO: We should fetch this from the server and pass a pretty component
        // down here to render cody is disabled on the instance nicely.
        isCodyEnabled: true, codyNotEnabledNotice: undefined, afterMarkdown: welcomeMessage, helpMarkdown: "", ChatButtonComponent: ChatButton, contextSelection: contextSelection, setContextSelection: setContextSelection, UserContextSelectorComponent: UserContextSelector_1.UserContextSelectorComponent, chatModels: chatModels, onCurrentChatModelChange: onCurrentChatModelChange, ChatModelDropdownMenu: ChatModelDropdownMenu_1.ChatModelDropdownMenu, userInfo: userInfo, chatEnabled: chatEnabled, EnhancedContextSettings: EnhancedContextSettings_1.EnhancedContextSettings, postMessage: msg => vscodeAPI.postMessage(msg), guardrails: guardrails, chatIDHistory: chatIDHistory, isWebviewActive: isWebviewActive }));
};
exports.Chat = Chat;
const ChatButton = ({ label, action, onClick, appearance, }) => ((0, jsx_runtime_1.jsx)(react_2.VSCodeButton, { type: "button", onClick: () => onClick(action), className: Chat_module_css_1.default.chatButton, appearance: appearance, children: label }));
const TextArea = ({ className, isFocusd, value, setValue, chatEnabled, required, onInput, onKeyDown, onKeyUp, onFocus, chatModels, messageBeingEdited, isNewChat, inputCaretPosition, isWebviewActive, }) => {
    const inputRef = (0, react_1.useRef)(null);
    const tips = ''; //'(@ to include files or symbols)'  HAIAR MOCKING
    const placeholder = isNewChat ? `Message ${tips}` : `Follow-Up Message ${tips}`;
    const disabledPlaceHolder = 'Chat has been disabled by your Enterprise instance site administrator';
    // biome-ignore lint/correctness/useExhaustiveDependencies: want new value to refresh it
    (0, react_1.useEffect)(() => {
        if (isFocusd) {
            if (isWebviewActive) {
                inputRef.current?.focus();
            }
            if (inputCaretPosition) {
                return;
            }
            // move cursor to end of line if current cursor position is at the beginning
            if (inputRef.current?.selectionStart === 0 && value.length > 0) {
                inputRef.current?.setSelectionRange(value.length, value.length);
            }
        }
    }, [isFocusd, value, messageBeingEdited, chatModels]);
    (0, react_1.useEffect)(() => {
        if (inputCaretPosition) {
            inputRef.current?.setSelectionRange(inputCaretPosition, inputCaretPosition);
            return;
        }
    }, [inputCaretPosition]);
    // Focus the textarea when the webview gains focus (unless there is text selected). This makes
    // it so that the user can immediately start typing to Cody after invoking `Cody: Focus on Chat
    // View` with the keyboard.
    (0, react_1.useEffect)(() => {
        const handleFocus = () => {
            if (document.getSelection()?.isCollapsed) {
                inputRef.current?.focus();
            }
        };
        window.addEventListener('focus', handleFocus);
        return () => {
            window.removeEventListener('focus', handleFocus);
        };
    }, []);
    const onTextAreaKeyDown = (0, react_1.useCallback)((event) => {
        onKeyDown?.(event, inputRef.current?.selectionStart ?? null);
    }, [onKeyDown]);
    const onTextAreaKeyUp = (0, react_1.useCallback)((event) => {
        onKeyUp?.(event, inputRef.current?.selectionStart ?? null);
    }, [onKeyUp]);
    const actualPlaceholder = chatEnabled ? placeholder : disabledPlaceHolder;
    const isDisabled = !chatEnabled;
    return ((0, jsx_runtime_1.jsx)("div", { className: (0, classnames_1.default)(Chat_module_css_1.default.chatInputContainer, className, chatModels && Chat_module_css_1.default.newChatInputContainer), "data-value": value || actualPlaceholder, children: (0, jsx_runtime_1.jsx)("textarea", { className: (0, classnames_1.default)(Chat_module_css_1.default.chatInput, className, chatModels && Chat_module_css_1.default.newChatInput, isDisabled && Chat_module_css_1.default.textareaDisabled), rows: 1, ref: inputRef, value: value, required: required, onInput: onInput, onKeyDown: onTextAreaKeyDown, onKeyUp: onTextAreaKeyUp, onFocus: onFocus, onPaste: onInput, placeholder: actualPlaceholder, "aria-label": "Chat message", title: "" // Set to blank to avoid HTML5 error tooltip "Please fill in this field"
            , disabled: isDisabled }) }));
};
const submitButtonTypes = {
    user: { icon: 'codicon codicon-arrow-up', title: 'Send Message' },
    edit: { icon: 'codicon codicon-check', title: 'Update Message' },
    'user-newchat': {
        icon: 'codicon codicon-add',
        title: 'Start New Chat Session',
    },
    abort: { icon: 'codicon codicon-debug-stop', title: 'Stop Generating' },
};
const SubmitButton = ({ type = 'user', className, disabled, onClick, onAbortMessageInProgress, }) => ((0, jsx_runtime_1.jsx)(react_2.VSCodeButton, { className: (0, classnames_1.default)(Chat_module_css_1.default.submitButton, className, disabled && Chat_module_css_1.default.submitButtonDisabled), type: "button", disabled: disabled, onClick: onAbortMessageInProgress ?? onClick, title: onAbortMessageInProgress ? submitButtonTypes.abort.title : submitButtonTypes[type]?.title, children: (0, jsx_runtime_1.jsx)("i", { className: onAbortMessageInProgress ? submitButtonTypes.abort.icon : submitButtonTypes[type]?.icon }) }));
const EditButton = ({ className, messageBeingEdited, setMessageBeingEdited, disabled, }) => ((0, jsx_runtime_1.jsx)(react_2.VSCodeButton, { className: (0, classnames_1.default)(Chat_module_css_1.default.editButton, className), appearance: "icon", title: disabled ? 'Cannot Edit Command' : 'Edit Your Message', type: "button", disabled: disabled, onClick: () => {
        setMessageBeingEdited(messageBeingEdited);
        (0, VSCodeApi_1.getVSCodeAPI)().postMessage({
            command: 'event',
            eventName: 'CodyVSCodeExtension:chatEditButton:clicked',
            properties: { source: 'chat' },
        });
    }, children: (0, jsx_runtime_1.jsx)("i", { className: "codicon codicon-edit" }) }));
const FeedbackButtons = ({ className, feedbackButtonsOnSubmit, }) => {
    const [feedbackSubmitted, setFeedbackSubmitted] = (0, react_1.useState)('');
    const onFeedbackBtnSubmit = (0, react_1.useCallback)((text) => {
        feedbackButtonsOnSubmit(text);
        setFeedbackSubmitted(text);
    }, [feedbackButtonsOnSubmit]);
    return ((0, jsx_runtime_1.jsxs)("div", { className: (0, classnames_1.default)(Chat_module_css_1.default.feedbackButtons, className), children: [!feedbackSubmitted && ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)(react_2.VSCodeButton, { className: (0, classnames_1.default)(Chat_module_css_1.default.feedbackButton), appearance: "icon", type: "button", onClick: () => onFeedbackBtnSubmit('thumbsUp'), children: (0, jsx_runtime_1.jsx)("i", { className: "codicon codicon-thumbsup" }) }), (0, jsx_runtime_1.jsx)(react_2.VSCodeButton, { className: (0, classnames_1.default)(Chat_module_css_1.default.feedbackButton), appearance: "icon", type: "button", onClick: () => onFeedbackBtnSubmit('thumbsDown'), children: (0, jsx_runtime_1.jsx)("i", { className: "codicon codicon-thumbsdown" }) })] })), feedbackSubmitted === 'thumbsUp' && ((0, jsx_runtime_1.jsxs)(react_2.VSCodeButton, { className: (0, classnames_1.default)(Chat_module_css_1.default.feedbackButton), appearance: "icon", type: "button", disabled: true, title: "Thanks for your feedback", children: [(0, jsx_runtime_1.jsx)("i", { className: "codicon codicon-thumbsup" }), (0, jsx_runtime_1.jsx)("i", { className: "codicon codicon-check" })] })), feedbackSubmitted === 'thumbsDown' && ((0, jsx_runtime_1.jsxs)("span", { className: Chat_module_css_1.default.thumbsDownFeedbackContainer, children: [(0, jsx_runtime_1.jsxs)(react_2.VSCodeButton, { className: (0, classnames_1.default)(Chat_module_css_1.default.feedbackButton), appearance: "icon", type: "button", disabled: true, title: "Thanks for your feedback", children: [(0, jsx_runtime_1.jsx)("i", { className: "codicon codicon-thumbsdown" }), (0, jsx_runtime_1.jsx)("i", { className: "codicon codicon-check" })] }), (0, jsx_runtime_1.jsx)(react_2.VSCodeLink, { href: String(protocol_1.CODY_FEEDBACK_URL), target: "_blank", title: "Help improve Cody by providing more feedback about the quality of this response", children: "Give Feedback" })] }))] }));
};
