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
exports.AuthProviderSimplified = void 0;
const vscode = __importStar(require("vscode"));
const cody_shared_1 = require("@sourcegraph/cody-shared");
// An auth provider for simplified onboarding. This is a sidecar to AuthProvider
// so we can deprecate the experiment later. AuthProviderSimplified only works
// for dotcom, and doesn't work on VScode web. See LoginSimplified.
class AuthProviderSimplified {
    async openExternalAuthUrl(classicAuthProvider, method) {
        if (!(await openExternalAuthUrl(method))) {
            return;
        }
        classicAuthProvider.authProviderSimplifiedWillAttemptAuth();
    }
}
exports.AuthProviderSimplified = AuthProviderSimplified;
// Opens authentication URLs for simplified onboarding.
async function openExternalAuthUrl(provider) {
    // Create the chain of redirects:
    // 1. Specific login page (GitHub, etc.) redirects to the post-sign up survey
    // 2. Post-sign up survery redirects to the new token page
    // 3. New token page redirects back to the extension with the new token
    const uriScheme = vscode.env.uriScheme;
    const referralCode = {
        'vscode-insiders': 'CODY_INSIDERS',
        vscodium: 'CODY_VSCODIUM',
    }[uriScheme] || 'CODY';
    const newTokenUrl = `/user/settings/tokens/new/callback?requestFrom=${referralCode}`;
    const postSignUpSurveyUrl = `/post-sign-up?returnTo=${newTokenUrl}`;
    const site = cody_shared_1.DOTCOM_URL.toString(); // Note, ends with the path /
    const genericLoginUrl = `${site}sign-in?returnTo=${postSignUpSurveyUrl}`;
    const gitHubLoginUrl = `${site}.auth/openidconnect/login?prompt_auth=github&pc=sams&redirect=${postSignUpSurveyUrl}`;
    const gitLabLoginUrl = `${site}.auth/openidconnect/login?prompt_auth=gitlab&pc=sams&redirect=${postSignUpSurveyUrl}`;
    const googleLoginUrl = `${site}.auth/openidconnect/login?prompt_auth=google&pc=sams&redirect=${postSignUpSurveyUrl}`;
    let uriSpec;
    switch (provider) {
        case 'github':
            uriSpec = gitHubLoginUrl;
            break;
        case 'gitlab':
            uriSpec = gitLabLoginUrl;
            break;
        case 'google':
            uriSpec = googleLoginUrl;
            break;
        default:
            // This login form has links to other login methods, it is the best
            // catch-all
            uriSpec = genericLoginUrl;
            break;
    }
    // VScode Uri handling escapes ?, = in the redirect parameter. dotcom's
    // redirectTo handling does not unescape these. As a result we route
    // /post-sign-up%3F... as a search. Work around VScode's Uri handling
    // by passing a string which gets passed through to a string|Uri parameter
    // anyway.
    // FIXME: Pass a Uri here when dotcom redirectTo handling applies one level
    // of unescaping to the parameter, or we special case the routing for
    // /post-sign-up%3F...
    return vscode.env.openExternal(uriSpec);
}
