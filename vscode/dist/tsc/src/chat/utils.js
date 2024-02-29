"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.countGeneratedCode = exports.newAuthStatus = void 0;
const protocol_1 = require("./protocol");
/**
 * Checks a user's authentication status.
 * @param endpoint The server endpoint.
 * @param isDotComOrApp Whether the user is on an insider build instance or enterprise instance.
 * @param user Whether the user is logged in.
 * @param isEmailVerified Whether the user has verified their email. Default to true for non-enterprise instances.
 * @param isCodyEnabled Whether Cody is enabled on the Sourcegraph instance. Default to true for non-enterprise instances.
 * @param userCanUpgrade Whether the user can upgrade their plan.
 * @param version The Sourcegraph instance version.
 * @param avatarURL The user's avatar URL, or '' if not set.
 * @param username The user's username.
 * @param displayName The user's display name, or '' if not set.
 * @param primaryEmail The user's primary email, or '' if not set.
 * @returns The user's authentication status. It's for frontend to display when instance is on unsupported version if siteHasCodyEnabled is false
 */
function newAuthStatus(endpoint, isDotComOrApp, user, isEmailVerified, isCodyEnabled, userCanUpgrade, version, avatarURL, username, displayName, primaryEmail, configOverwrites) {
    if (!user) {
        return { ...protocol_1.unauthenticatedStatus, endpoint };
    }
    const authStatus = { ...protocol_1.defaultAuthStatus, endpoint };
    // Set values and return early
    authStatus.authenticated = user;
    authStatus.showInvalidAccessTokenError = !user;
    authStatus.requiresVerifiedEmail = isDotComOrApp;
    authStatus.hasVerifiedEmail = isDotComOrApp && isEmailVerified;
    authStatus.siteHasCodyEnabled = isCodyEnabled;
    authStatus.userCanUpgrade = userCanUpgrade;
    authStatus.siteVersion = version;
    authStatus.avatarURL = avatarURL;
    authStatus.primaryEmail = primaryEmail || '';
    authStatus.displayName = displayName || '';
    authStatus.username = username;
    if (configOverwrites) {
        authStatus.configOverwrites = configOverwrites;
    }
    const isLoggedIn = authStatus.siteHasCodyEnabled && authStatus.authenticated;
    const isAllowed = authStatus.requiresVerifiedEmail ? authStatus.hasVerifiedEmail : true;
    authStatus.isLoggedIn = isLoggedIn && isAllowed;
    authStatus.isDotCom = isDotComOrApp;
    return authStatus;
}
exports.newAuthStatus = newAuthStatus;
/**
 * Counts the number of lines and characters in code blocks in a given string.
 * @param text - The string to search for code blocks.
 * @returns An object with the total lineCount and charCount of code in code blocks,
 * or null if no code blocks are found.
 */
const countGeneratedCode = (text) => {
    const codeBlockRegex = /```[\S\s]*?```/g;
    const codeBlocks = text.match(codeBlockRegex);
    if (!codeBlocks) {
        return null;
    }
    const count = { lineCount: 0, charCount: 0 };
    const backticks = '```';
    for (const block of codeBlocks) {
        const lines = block.split('\n');
        const codeLines = lines.filter(line => !line.startsWith(backticks));
        const lineCount = codeLines.length;
        const language = lines[0].replace(backticks, '');
        // 2 backticks + 2 newline
        const charCount = block.length - language.length - backticks.length * 2 - 2;
        count.charCount += charCount;
        count.lineCount += lineCount;
    }
    return count;
};
exports.countGeneratedCode = countGeneratedCode;
