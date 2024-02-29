"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnterpriseMultipleRepositories = exports.EnterpriseNoRepositories = exports.ConsumerMultipleProviders = exports.SingleTile = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const preview_api_1 = require("@storybook/preview-api");
const VSCodeStoryDecorator_1 = require("../storybook/VSCodeStoryDecorator");
const EnhancedContextSettings_1 = require("./EnhancedContextSettings");
const meta = {
    title: 'cody/Enhanced Context',
    component: EnhancedContextSettings_1.EnhancedContextSettings,
    decorators: [VSCodeStoryDecorator_1.VSCodeStoryDecorator],
    parameters: {
        backgrounds: {
            default: 'vscode',
            values: [
                {
                    name: 'vscode',
                    value: 'var(--vscode-sideBar-background)',
                },
            ],
        },
    },
};
exports.default = meta;
exports.SingleTile = {
    args: {
        presentationMode: EnhancedContextSettings_1.EnhancedContextPresentationMode.Consumer,
        isOpen: true,
        name: '~/sourcegraph',
        kind: 'search',
        type: 'local',
        state: 'ready',
    },
    argTypes: {
        presentationMode: {
            options: ['consumer', 'enterprise'],
            control: 'radio',
        },
        isOpen: { control: 'boolean' },
        name: { control: 'text' },
        kind: {
            options: ['embeddings', 'search'],
            control: 'radio',
        },
        type: {
            options: ['local', 'remote'],
            control: 'radio',
            if: {
                arg: 'kind',
                eq: 'search',
            },
        },
        state: {
            options: ['indeterminate', 'unconsented', 'indexing', 'ready', 'no-match'],
            control: 'select',
        },
        id: { control: 'text' },
        inclusion: {
            options: ['auto', 'manual'],
            control: 'radio',
        },
    },
    render: function Render() {
        const [args, updateArgs] = (0, preview_api_1.useArgs)();
        const [isOpen, setIsOpen] = (0, preview_api_1.useState)(args.isOpen);
        const eventHandlers = {
            onChooseRemoteSearchRepo() {
                alert('Choose some repositories...');
            },
            onConsentToEmbeddings(provider) {
                updateArgs({ state: 'indexing' });
            },
            onEnabledChange(enabled) {
                console.log(`Thank you for ${enabled ? 'enabling' : 'disabling'} the enhanced context!`);
            },
            onRemoveRemoteSearchRepo(id) {
                alert(`Remove remote search repo "${id}"`);
            },
            onShouldBuildSymfIndex(provider) {
                updateArgs({ state: 'indexing' });
            },
        };
        return ((0, jsx_runtime_1.jsx)(EnhancedContextSettings_1.EnhancedContextContext.Provider, { value: {
                groups: [
                    {
                        displayName: args.name,
                        providers: [
                            {
                                kind: args.kind,
                                type: args.type,
                                state: args.state,
                                name: args.name,
                                id: args.id,
                                inclusion: args.inclusion,
                            },
                        ],
                    },
                ],
            }, children: (0, jsx_runtime_1.jsx)(EnhancedContextSettings_1.EnhancedContextEventHandlers.Provider, { value: eventHandlers, children: (0, jsx_runtime_1.jsx)("div", { style: {
                        position: 'absolute',
                        bottom: 20,
                        right: 20,
                    }, children: (0, jsx_runtime_1.jsx)(EnhancedContextSettings_1.EnhancedContextSettings, { isOpen: isOpen, setOpen: () => setIsOpen(!isOpen), presentationMode: args.presentationMode }) }) }) }));
    },
};
exports.ConsumerMultipleProviders = {
    render: function Render() {
        const [isOpen, setIsOpen] = (0, preview_api_1.useState)(true);
        return ((0, jsx_runtime_1.jsx)(EnhancedContextSettings_1.EnhancedContextContext.Provider, { value: {
                groups: [
                    {
                        displayName: '~/projects/foo',
                        providers: [
                            { kind: 'embeddings', state: 'unconsented' },
                            { kind: 'search', type: 'local', state: 'indexing' },
                        ],
                    },
                ],
            }, children: (0, jsx_runtime_1.jsx)("div", { style: {
                    position: 'absolute',
                    bottom: 20,
                    right: 20,
                }, children: (0, jsx_runtime_1.jsx)(EnhancedContextSettings_1.EnhancedContextSettings, { isOpen: isOpen, setOpen: () => setIsOpen(!isOpen), presentationMode: EnhancedContextSettings_1.EnhancedContextPresentationMode.Consumer }) }) }));
    },
};
exports.EnterpriseNoRepositories = {
    render: function Render() {
        const [isOpen, setIsOpen] = (0, preview_api_1.useState)(true);
        return ((0, jsx_runtime_1.jsx)(EnhancedContextSettings_1.EnhancedContextContext.Provider, { value: {
                groups: [],
            }, children: (0, jsx_runtime_1.jsx)("div", { style: {
                    position: 'absolute',
                    bottom: 20,
                    right: 20,
                }, children: (0, jsx_runtime_1.jsx)(EnhancedContextSettings_1.EnhancedContextSettings, { presentationMode: EnhancedContextSettings_1.EnhancedContextPresentationMode.Enterprise, isOpen: isOpen, setOpen: () => setIsOpen(!isOpen) }) }) }));
    },
};
exports.EnterpriseMultipleRepositories = {
    render: function Render() {
        const [isOpen, setIsOpen] = (0, preview_api_1.useState)(true);
        return ((0, jsx_runtime_1.jsx)(EnhancedContextSettings_1.EnhancedContextContext.Provider, { value: {
                groups: [
                    {
                        displayName: 'github.com/megacorp/foo',
                        providers: [
                            {
                                kind: 'search',
                                type: 'remote',
                                state: 'ready',
                                id: 'pqrxy',
                                inclusion: 'manual',
                            },
                        ],
                    },
                    {
                        displayName: 'github.com/megacorp/bar',
                        providers: [
                            {
                                kind: 'search',
                                type: 'remote',
                                state: 'ready',
                                id: 'xgzwa',
                                inclusion: 'auto',
                            },
                        ],
                    },
                    {
                        displayName: 'github.com/subsidiarycorp/handbook',
                        providers: [
                            {
                                kind: 'search',
                                type: 'remote',
                                state: 'ready',
                                id: 'pffty',
                                inclusion: 'manual',
                            },
                        ],
                    },
                ],
            }, children: (0, jsx_runtime_1.jsx)("div", { style: {
                    position: 'absolute',
                    bottom: 20,
                    right: 20,
                }, children: (0, jsx_runtime_1.jsx)(EnhancedContextSettings_1.EnhancedContextSettings, { presentationMode: EnhancedContextSettings_1.EnhancedContextPresentationMode.Enterprise, isOpen: isOpen, setOpen: () => setIsOpen(!isOpen) }) }) }));
    },
};
