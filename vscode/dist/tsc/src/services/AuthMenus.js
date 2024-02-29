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
Object.defineProperty(exports, "__esModule", { value: true });
exports.showAccessTokenInputBox = exports.showInstanceURLInputBox = exports.AuthMenu = void 0;
const vscode = __importStar(require("vscode"));
const cody_shared_1 = require("@sourcegraph/cody-shared");
const protocol_1 = require("../chat/protocol");
function getItemLabel(uri, current) {
    const icon = current ? '$(check) ' : '';
    if ((0, cody_shared_1.isDotCom)(uri)) {
        return `${icon}Sourcegraph.com`;
    }
    return `${icon}${uri}`;
}
const AuthMenu = async (type, historyItems) => {
    // Create option items
    // Exclude App from the history list.
    historyItems = historyItems?.filter(uri => uri !== cody_shared_1.LOCAL_APP_URL.toString());
    const historySize = historyItems?.length;
    const history = historySize > 0
        ? historyItems
            ?.map((uri, i) => ({
            id: uri,
            label: getItemLabel(uri, type === 'switch' && i === historySize - 1),
            description: '',
            uri,
        }))
            .reverse()
        : [];
    const separator = [{ label: type === 'signin' ? 'previously used' : 'current', kind: -1 }];
    const optionItems = [...LoginMenuOptionItems, ...separator, ...history];
    const option = (await vscode.window.showQuickPick(optionItems, AuthMenuOptions[type]));
    return option;
};
exports.AuthMenu = AuthMenu;
/**
 * Show a VS Code input box to ask the user to enter a Sourcegraph instance URL.
 */
async function showInstanceURLInputBox(title) {
    const result = await vscode.window.showInputBox({
        title,
        prompt: 'Enter the URL of the Sourcegraph instance. For example, https://sourcegraph.example.com.',
        placeHolder: 'https://sourcegraph.example.com',
        value: 'https://',
        password: false,
        ignoreFocusOut: true,
        // valide input to ensure the user is not entering a token as URL
        validateInput: (value) => {
            // ignore empty value
            if (!value) {
                return null;
            }
            if ((0, protocol_1.isSourcegraphToken)(value)) {
                return 'Please enter a valid URL';
            }
            if (value.length > 4 && !value.startsWith('http')) {
                return 'URL must start with http or https';
            }
            if (!/([.]|^https?:\/\/)/.test(value)) {
                return 'Please enter a valid URL';
            }
            return null;
        },
    });
    if (typeof result === 'string') {
        return result.trim();
    }
    return result;
}
exports.showInstanceURLInputBox = showInstanceURLInputBox;
/**
 * Show a VS Code input box to ask the user to enter an access token.
 */
async function showAccessTokenInputBox(endpoint) {
    const result = await vscode.window.showInputBox({
        title: endpoint,
        prompt: 'Paste your access token. To create an access token, go to "Settings" and then "Access tokens" on the Sourcegraph instance.',
        placeHolder: 'Access Token',
        password: true,
        ignoreFocusOut: true,
    });
    if (typeof result === 'string') {
        return result.trim();
    }
    return result;
}
exports.showAccessTokenInputBox = showAccessTokenInputBox;
const AuthMenuOptions = {
    signin: {
        title: 'Other Sign-in Options',
        placeholder: 'Choose a sign-in option',
    },
    switch: {
        title: 'Switch Account',
        placeHolder: 'Choose an account',
    },
};
const LoginMenuOptionItems = [
    {
        id: 'enterprise',
        label: 'Sign In to Sourcegraph Enterprise Instance',
        description: 'v5.1 and above',
        totalSteps: 1,
        picked: true,
    },
    {
        id: 'token',
        label: 'Sign In to Sourcegraph Enterprise Instance with Access Token',
        description: 'v5.0 and above',
        totalSteps: 2,
    },
    {
        id: 'token',
        label: 'Sign In with URL and Access Token',
        totalSteps: 2,
    },
];
