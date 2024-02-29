"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isSourcegraphToken = exports.isLoggedIn = exports.networkErrorAuthStatus = exports.unauthenticatedStatus = exports.defaultAuthStatus = exports.ACCOUNT_LIMITS_INFO_URL = exports.ACCOUNT_USAGE_URL = exports.ACCOUNT_UPGRADE_URL = exports.CODY_FEEDBACK_URL = exports.DISCORD_URL = exports.CODY_DOC_URL = void 0;
/**
 * URLs for the Sourcegraph instance and app.
 */
exports.CODY_DOC_URL = new URL('https://sourcegraph.com/docs/cody');
// Community and support
exports.DISCORD_URL = new URL('https://discord.gg/s2qDtYGnAE');
exports.CODY_FEEDBACK_URL = new URL('https://github.com/sourcegraph/cody/issues/new/choose');
// Account
exports.ACCOUNT_UPGRADE_URL = new URL('https://sourcegraph.com/cody/subscription');
exports.ACCOUNT_USAGE_URL = new URL('https://sourcegraph.com/cody/manage');
exports.ACCOUNT_LIMITS_INFO_URL = new URL('https://sourcegraph.com/docs/cody/troubleshooting#autocomplete-rate-limits');
exports.defaultAuthStatus = {
    endpoint: '',
    isDotCom: true,
    isLoggedIn: false,
    showInvalidAccessTokenError: false,
    authenticated: false,
    hasVerifiedEmail: false,
    requiresVerifiedEmail: false,
    siteHasCodyEnabled: false,
    siteVersion: '',
    userCanUpgrade: false,
    username: '',
    primaryEmail: '',
    displayName: '',
    avatarURL: '',
};
exports.unauthenticatedStatus = {
    endpoint: '',
    isDotCom: true,
    isLoggedIn: false,
    showInvalidAccessTokenError: true,
    authenticated: false,
    hasVerifiedEmail: false,
    requiresVerifiedEmail: false,
    siteHasCodyEnabled: false,
    siteVersion: '',
    userCanUpgrade: false,
    username: '',
    primaryEmail: '',
    displayName: '',
    avatarURL: '',
};
exports.networkErrorAuthStatus = {
    isDotCom: false,
    showInvalidAccessTokenError: false,
    authenticated: false,
    isLoggedIn: false,
    hasVerifiedEmail: false,
    showNetworkError: true,
    requiresVerifiedEmail: false,
    siteHasCodyEnabled: false,
    siteVersion: '',
    userCanUpgrade: false,
    username: '',
    primaryEmail: '',
    displayName: '',
    avatarURL: '',
};
function isLoggedIn(authStatus) {
    if (!authStatus.siteHasCodyEnabled) {
        return false;
    }
    return (authStatus.authenticated &&
        (authStatus.requiresVerifiedEmail ? authStatus.hasVerifiedEmail : true));
}
exports.isLoggedIn = isLoggedIn;
// Provide backward compatibility for the old token regex
// Details: https://docs.sourcegraph.com/dev/security/secret_formats
const sourcegraphTokenRegex = /(sgp_(?:[a-fA-F0-9]{16}|local)|sgp_)?[a-fA-F0-9]{40}|(sgd|slk|sgs)_[a-fA-F0-9]{64}/;
/**
 * Checks if the given text matches the regex for a Sourcegraph access token.
 *
 * @param text - The text to check against the regex.
 * @returns Whether the text matches the Sourcegraph token regex.
 */
function isSourcegraphToken(text) {
    return sourcegraphTokenRegex.test(text);
}
exports.isSourcegraphToken = isSourcegraphToken;
