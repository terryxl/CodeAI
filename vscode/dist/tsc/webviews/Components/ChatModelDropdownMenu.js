"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatModelDropdownMenu = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const react_2 = require("@vscode/webview-ui-toolkit/react");
const classnames_1 = __importDefault(require("classnames"));
const LLMProviderIcons_1 = require("@sourcegraph/cody-ui/src/icons/LLMProviderIcons");
const VSCodeApi_1 = require("../utils/VSCodeApi");
const ChatModelDropdownMenu_module_css_1 = __importDefault(require("./ChatModelDropdownMenu.module.css"));
const ChatModelDropdownMenu = ({ models, disabled, // disabled is true when transcript length is > 1
onCurrentChatModelChange, userInfo, }) => {
    const [currentModel, setCurrentModel] = (0, react_1.useState)(models.find(m => m.default) || models[0]);
    const currentModelIndex = models.indexOf(models.find(m => m.default) || models[0]);
    const dropdownRef = (0, react_1.useRef)(null);
    const isCodyProUser = userInfo.isDotComUser && userInfo.isCodyProUser;
    const isEnterpriseUser = !userInfo.isDotComUser;
    const showCodyProBadge = !isEnterpriseUser && !isCodyProUser;
    const handleChange = (0, react_1.useCallback)((event) => {
        const selectedModel = models[event.target?.selectedIndex];
        if (showCodyProBadge && selectedModel.codyProOnly) {
            (0, VSCodeApi_1.getVSCodeAPI)().postMessage({
                command: 'links',
                value: 'https://sourcegraph.com/cody/subscription',
            });
            (0, VSCodeApi_1.getVSCodeAPI)().postMessage({
                command: 'event',
                eventName: 'CodyVSCodeExtension:upgradeLLMChoiceCTA:clicked',
                properties: { limit_type: 'chat_commands' },
            });
            return;
        }
        (0, VSCodeApi_1.getVSCodeAPI)().postMessage({
            command: 'event',
            eventName: 'CodyVSCodeExtension:chooseLLM:clicked',
            properties: { LLM_provider: selectedModel.model },
        });
        onCurrentChatModelChange(selectedModel);
        setCurrentModel(selectedModel);
    }, [models, onCurrentChatModelChange, showCodyProBadge]);
    function isModelDisabled(codyProOnly) {
        return codyProOnly ? codyProOnly && showCodyProBadge : false;
    }
    if (!models.length || models.length < 1) {
        return null;
    }
    const enabledDropdownProps = {
        title: `This chat is using ${currentModel.title}. Start a new chat to choose a different model.`,
        onClickCapture: () => {
            // Trigger `CodyVSCodeExtension:openLLMDropdown:clicked` only when dropdown is about to be opened.
            if (!dropdownRef.current?.open) {
                (0, VSCodeApi_1.getVSCodeAPI)().postMessage({
                    command: 'event',
                    eventName: 'CodyVSCodeExtension:openLLMDropdown:clicked',
                    properties: undefined,
                });
            }
        },
    };
    return ((0, jsx_runtime_1.jsx)("div", { className: ChatModelDropdownMenu_module_css_1.default.container, children: (0, jsx_runtime_1.jsxs)(react_2.VSCodeDropdown, { ref: dropdownRef, disabled: disabled, className: ChatModelDropdownMenu_module_css_1.default.dropdownContainer, onChange: handleChange, selectedIndex: currentModelIndex, ...(!disabled && enabledDropdownProps), children: [models?.map((option, index) => ((0, jsx_runtime_1.jsxs)(react_2.VSCodeOption, { className: ChatModelDropdownMenu_module_css_1.default.option, id: index.toString(), title: isModelDisabled(option.codyProOnly)
                        ? `Upgrade to Cody Pro to use ${option.title}`
                        : undefined, children: [(0, jsx_runtime_1.jsx)(ProviderIcon, { model: option.model }), (0, jsx_runtime_1.jsxs)("span", { className: (0, classnames_1.default)(ChatModelDropdownMenu_module_css_1.default.titleContainer, isModelDisabled(option.codyProOnly) && ChatModelDropdownMenu_module_css_1.default.disabled), title: isEnterpriseUser
                                ? 'Chat model set by your Sourcegraph Enterprise admin'
                                : undefined, children: [(0, jsx_runtime_1.jsx)("span", { className: ChatModelDropdownMenu_module_css_1.default.title, children: option.title }), (0, jsx_runtime_1.jsx)("span", { className: ChatModelDropdownMenu_module_css_1.default.provider, children: ` by ${option.provider}` })] }), isModelDisabled(option.codyProOnly) && ((0, jsx_runtime_1.jsx)("span", { className: ChatModelDropdownMenu_module_css_1.default.badge, children: "Pro" }))] }, option.model))), (0, jsx_runtime_1.jsxs)("div", { slot: "selected-value", className: ChatModelDropdownMenu_module_css_1.default.selectedValue, children: [(0, jsx_runtime_1.jsx)(ProviderIcon, { model: currentModel.model }), (0, jsx_runtime_1.jsx)("span", { children: (0, jsx_runtime_1.jsx)("span", { className: ChatModelDropdownMenu_module_css_1.default.title, children: currentModel.title }) })] })] }) }));
};
exports.ChatModelDropdownMenu = ChatModelDropdownMenu;
const ProviderIcon = ({ model, className }) => {
    if (model.startsWith('openai/')) {
        return (0, jsx_runtime_1.jsx)(LLMProviderIcons_1.OpenAILogo, { className: className });
    }
    if (model.startsWith('anthropic/')) {
        return (0, jsx_runtime_1.jsx)(LLMProviderIcons_1.AnthropicLogo, { className: className });
    }
    if (model.includes('mixtral')) {
        return (0, jsx_runtime_1.jsx)(LLMProviderIcons_1.MistralLogo, { className: className });
    }
    return (0, jsx_runtime_1.jsx)(jsx_runtime_1.Fragment, {});
};
