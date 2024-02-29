"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const assert_1 = __importDefault(require("assert"));
const vitest_1 = require("vitest");
const LocalStorageProvider_1 = require("./LocalStorageProvider");
(0, vitest_1.describe)('LocalStorageProvider', () => {
    // Set up local storage backed by an object.
    let localStorageData = {};
    LocalStorageProvider_1.localStorage.setStorage({
        get: (key) => localStorageData[key],
        update: (key, value) => {
            localStorageData[key] = value;
            return Promise.resolve();
        },
    });
    (0, vitest_1.beforeEach)(() => {
        localStorageData = {};
    });
    (0, vitest_1.it)('converts chat history without context files upon loading', async () => {
        await LocalStorageProvider_1.localStorage.setChatHistory(DUMMY_AUTH_STATUS, {
            chat: { a: null },
            input: ['a', 'b', 'c'], // API expects new format so cast any.
        });
        const loadedHistory = LocalStorageProvider_1.localStorage.getChatHistory(DUMMY_AUTH_STATUS);
        assert_1.default.deepStrictEqual(loadedHistory, {
            chat: { a: null },
            input: [
                // Expect new format with context files.
                { inputText: 'a', inputContextFiles: [] },
                { inputText: 'b', inputContextFiles: [] },
                { inputText: 'c', inputContextFiles: [] },
            ],
        });
    });
});
const DUMMY_AUTH_STATUS = {
    endpoint: null,
    isDotCom: true,
    isLoggedIn: true,
    showInvalidAccessTokenError: false,
    authenticated: true,
    hasVerifiedEmail: true,
    requiresVerifiedEmail: true,
    siteHasCodyEnabled: true,
    siteVersion: '1234',
    primaryEmail: 'heisenberg@exmaple.com',
    username: 'uwu',
    displayName: 'w.w.',
    avatarURL: '',
    userCanUpgrade: false,
};
