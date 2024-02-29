"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const protocol_1 = require("./protocol");
const utils_1 = require("./utils");
(0, vitest_1.describe)('validateAuthStatus', () => {
    // NOTE: Site version is for frontend use and doesn't play a role in validating auth status
    const siteVersion = '';
    const isDotComOrApp = true;
    const verifiedEmail = true;
    const codyEnabled = true;
    const validUser = true;
    const endpoint = '';
    const userCanUpgrade = false;
    const username = 'cody';
    const primaryEmail = 'me@domain.test';
    const displayName = 'Test Name';
    const avatarURL = 'https://domain.test/avatar.png';
    // DOTCOM AND APP USERS
    (0, vitest_1.test)('returns auth state for invalid user on dotcom or app instance', () => {
        const expected = { ...protocol_1.unauthenticatedStatus, endpoint };
        (0, vitest_1.expect)((0, utils_1.newAuthStatus)(endpoint, isDotComOrApp, !validUser, !verifiedEmail, codyEnabled, userCanUpgrade, siteVersion, avatarURL, username, displayName, primaryEmail)).toEqual(expected);
    });
    (0, vitest_1.test)('returns auth status for valid user with varified email on dotcom or app instance', () => {
        const expected = {
            ...protocol_1.defaultAuthStatus,
            authenticated: true,
            hasVerifiedEmail: true,
            showInvalidAccessTokenError: false,
            requiresVerifiedEmail: true,
            siteHasCodyEnabled: true,
            isLoggedIn: true,
            endpoint,
            avatarURL,
            username,
            displayName,
            primaryEmail,
        };
        (0, vitest_1.expect)((0, utils_1.newAuthStatus)(endpoint, isDotComOrApp, validUser, verifiedEmail, codyEnabled, userCanUpgrade, siteVersion, avatarURL, username, displayName, primaryEmail)).toEqual(expected);
    });
    (0, vitest_1.test)('returns auth status for valid user without verified email on dotcom or app instance', () => {
        const expected = {
            ...protocol_1.defaultAuthStatus,
            authenticated: true,
            hasVerifiedEmail: false,
            requiresVerifiedEmail: true,
            siteHasCodyEnabled: true,
            endpoint,
            avatarURL,
            username,
            displayName,
            primaryEmail,
        };
        (0, vitest_1.expect)((0, utils_1.newAuthStatus)(endpoint, isDotComOrApp, validUser, !verifiedEmail, codyEnabled, userCanUpgrade, siteVersion, avatarURL, username, displayName, primaryEmail)).toEqual(expected);
    });
    // ENTERPRISE
    (0, vitest_1.test)('returns auth status for valid user on enterprise instance with Cody enabled', () => {
        const expected = {
            ...protocol_1.defaultAuthStatus,
            authenticated: true,
            siteHasCodyEnabled: true,
            isLoggedIn: true,
            isDotCom: false,
            endpoint,
            avatarURL,
            username,
            displayName,
            primaryEmail,
        };
        (0, vitest_1.expect)((0, utils_1.newAuthStatus)(endpoint, !isDotComOrApp, validUser, verifiedEmail, codyEnabled, userCanUpgrade, siteVersion, avatarURL, username, displayName, primaryEmail)).toEqual(expected);
    });
    (0, vitest_1.test)('returns auth status for invalid user on enterprise instance with Cody enabled', () => {
        const expected = { ...protocol_1.unauthenticatedStatus, endpoint };
        (0, vitest_1.expect)((0, utils_1.newAuthStatus)(endpoint, !isDotComOrApp, !validUser, verifiedEmail, codyEnabled, userCanUpgrade, siteVersion, avatarURL, primaryEmail, displayName)).toEqual(expected);
    });
    (0, vitest_1.test)('returns auth status for valid user on enterprise instance with Cody disabled', () => {
        const expected = {
            ...protocol_1.defaultAuthStatus,
            authenticated: true,
            siteHasCodyEnabled: false,
            endpoint,
            avatarURL,
            username,
            displayName,
            primaryEmail,
            isDotCom: false,
        };
        (0, vitest_1.expect)((0, utils_1.newAuthStatus)(endpoint, !isDotComOrApp, validUser, !verifiedEmail, !codyEnabled, userCanUpgrade, siteVersion, avatarURL, username, displayName, primaryEmail)).toEqual(expected);
    });
    (0, vitest_1.test)('returns auth status for invalid user on enterprise instance with Cody disabled', () => {
        const expected = { ...protocol_1.unauthenticatedStatus, endpoint };
        (0, vitest_1.expect)((0, utils_1.newAuthStatus)(endpoint, !isDotComOrApp, !validUser, verifiedEmail, !codyEnabled, userCanUpgrade, siteVersion, avatarURL, username, displayName, primaryEmail)).toEqual(expected);
    });
    (0, vitest_1.test)('returns auth status for signed in user without email&displayName on enterprise instance', () => {
        const expected = {
            ...protocol_1.defaultAuthStatus,
            authenticated: true,
            siteHasCodyEnabled: true,
            isLoggedIn: true,
            isDotCom: false,
            endpoint,
            avatarURL,
            username,
            displayName: '',
            primaryEmail: '',
        };
        (0, vitest_1.expect)((0, utils_1.newAuthStatus)(endpoint, !isDotComOrApp, validUser, verifiedEmail, codyEnabled, userCanUpgrade, siteVersion, avatarURL, username)).toEqual(expected);
    });
});
