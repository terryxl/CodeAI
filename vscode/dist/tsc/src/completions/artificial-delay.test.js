"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const artificial_delay_1 = require("./artificial-delay");
const featureFlags = {
    user: true,
};
(0, vitest_1.describe)('getArtificialDelay', () => {
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.useFakeTimers();
    });
    (0, vitest_1.afterEach)(() => {
        vitest_1.vi.restoreAllMocks();
        (0, artificial_delay_1.resetArtificialDelay)();
    });
    (0, vitest_1.it)('returns gradually increasing latency up to max for CSS when suggestions are rejected', () => {
        const uri = 'file://foo/bar/test.css';
        // css is a low performance language
        const languageId = 'css';
        (0, vitest_1.expect)(artificial_delay_1.lowPerformanceLanguageIds.has(languageId)).toBe(true);
        // start with default high latency for low performance lang with default user latency added
        (0, vitest_1.expect)((0, artificial_delay_1.getArtificialDelay)(featureFlags, uri, languageId)).toBe(1000);
        (0, vitest_1.expect)((0, artificial_delay_1.getArtificialDelay)(featureFlags, uri, languageId)).toBe(1000);
        (0, vitest_1.expect)((0, artificial_delay_1.getArtificialDelay)(featureFlags, uri, languageId)).toBe(1000);
        (0, vitest_1.expect)((0, artificial_delay_1.getArtificialDelay)(featureFlags, uri, languageId)).toBe(1000);
        (0, vitest_1.expect)((0, artificial_delay_1.getArtificialDelay)(featureFlags, uri, languageId)).toBe(1000);
        // start at default, but gradually increasing latency after 5 rejected suggestions
        (0, vitest_1.expect)((0, artificial_delay_1.getArtificialDelay)(featureFlags, uri, languageId)).toBe(1050);
        (0, vitest_1.expect)((0, artificial_delay_1.getArtificialDelay)(featureFlags, uri, languageId)).toBe(1100);
        (0, vitest_1.expect)((0, artificial_delay_1.getArtificialDelay)(featureFlags, uri, languageId)).toBe(1150);
        (0, vitest_1.expect)((0, artificial_delay_1.getArtificialDelay)(featureFlags, uri, languageId)).toBe(1200);
        (0, vitest_1.expect)((0, artificial_delay_1.getArtificialDelay)(featureFlags, uri, languageId)).toBe(1250);
        (0, vitest_1.expect)((0, artificial_delay_1.getArtificialDelay)(featureFlags, uri, languageId)).toBe(1300);
        (0, vitest_1.expect)((0, artificial_delay_1.getArtificialDelay)(featureFlags, uri, languageId)).toBe(1350);
        (0, vitest_1.expect)((0, artificial_delay_1.getArtificialDelay)(featureFlags, uri, languageId)).toBe(1400);
        // max latency at 1400
        (0, vitest_1.expect)((0, artificial_delay_1.getArtificialDelay)(featureFlags, uri, languageId)).toBe(1400);
        // after the suggestion was accepted, user latency resets to 0, using baseline only
        (0, artificial_delay_1.resetArtificialDelay)();
        (0, vitest_1.expect)((0, artificial_delay_1.getArtificialDelay)(featureFlags, uri, languageId)).toBe(1000);
        (0, artificial_delay_1.resetArtificialDelay)();
        (0, vitest_1.expect)((0, artificial_delay_1.getArtificialDelay)(featureFlags, uri, languageId)).toBe(1000);
        (0, vitest_1.expect)((0, artificial_delay_1.getArtificialDelay)(featureFlags, uri, languageId)).toBe(1000);
        (0, vitest_1.expect)((0, artificial_delay_1.getArtificialDelay)(featureFlags, uri, languageId)).toBe(1000);
        (0, vitest_1.expect)((0, artificial_delay_1.getArtificialDelay)(featureFlags, uri, languageId)).toBe(1000);
        (0, vitest_1.expect)((0, artificial_delay_1.getArtificialDelay)(featureFlags, uri, languageId)).toBe(1000);
        // gradually increasing latency after 5 rejected suggestions
        (0, vitest_1.expect)((0, artificial_delay_1.getArtificialDelay)(featureFlags, uri, languageId)).toBe(1050);
        (0, vitest_1.expect)((0, artificial_delay_1.getArtificialDelay)(featureFlags, uri, languageId)).toBe(1100);
        (0, vitest_1.expect)((0, artificial_delay_1.getArtificialDelay)(featureFlags, uri, languageId)).toBe(1150);
        (0, vitest_1.expect)((0, artificial_delay_1.getArtificialDelay)(featureFlags, uri, languageId)).toBe(1200);
        (0, vitest_1.expect)((0, artificial_delay_1.getArtificialDelay)(featureFlags, uri, languageId)).toBe(1250);
        (0, vitest_1.expect)((0, artificial_delay_1.getArtificialDelay)(featureFlags, uri, languageId)).toBe(1300);
        (0, vitest_1.expect)((0, artificial_delay_1.getArtificialDelay)(featureFlags, uri, languageId)).toBe(1350);
        (0, vitest_1.expect)((0, artificial_delay_1.getArtificialDelay)(featureFlags, uri, languageId)).toBe(1400);
        // Latency will not reset before 5 minutes
        vitest_1.vi.advanceTimersByTime(3 * 60 * 1000);
        (0, vitest_1.expect)((0, artificial_delay_1.getArtificialDelay)(featureFlags, uri, languageId)).toBe(1400);
        // Latency will be reset after 5 minutes
        vitest_1.vi.advanceTimersByTime(5 * 60 * 1000);
        (0, vitest_1.expect)((0, artificial_delay_1.getArtificialDelay)(featureFlags, uri, languageId)).toBe(1000);
        // reset latency on accepted suggestion
        (0, artificial_delay_1.resetArtificialDelay)();
        (0, vitest_1.expect)((0, artificial_delay_1.getArtificialDelay)(featureFlags, uri, languageId)).toBe(1000);
    });
    (0, vitest_1.it)('returns increasing latency after rejecting suggestions', () => {
        const uri = 'file://foo/bar/test.ts';
        // Confirm typescript is not a low performance language
        const languageId = 'typescript';
        (0, vitest_1.expect)(artificial_delay_1.lowPerformanceLanguageIds.has(languageId)).toBe(false);
        // start at default, but gradually increasing latency after 5 rejected suggestions
        (0, vitest_1.expect)((0, artificial_delay_1.getArtificialDelay)(featureFlags, uri, languageId, 'arguments')).toBe(0);
        (0, vitest_1.expect)((0, artificial_delay_1.getArtificialDelay)(featureFlags, uri, languageId, 'function.body')).toBe(0);
        // baseline latency increased to 1000 due to comment node type
        (0, vitest_1.expect)((0, artificial_delay_1.getArtificialDelay)(featureFlags, uri, languageId, 'comment')).toBe(1000);
        (0, vitest_1.expect)((0, artificial_delay_1.getArtificialDelay)(featureFlags, uri, languageId)).toBe(0);
        (0, vitest_1.expect)((0, artificial_delay_1.getArtificialDelay)(featureFlags, uri, languageId)).toBe(0);
        // gradually increasing latency after 5 rejected suggestions
        (0, vitest_1.expect)((0, artificial_delay_1.getArtificialDelay)(featureFlags, uri, languageId)).toBe(50);
        (0, vitest_1.expect)((0, artificial_delay_1.getArtificialDelay)(featureFlags, uri, languageId)).toBe(100);
        (0, vitest_1.expect)((0, artificial_delay_1.getArtificialDelay)(featureFlags, uri, languageId)).toBe(150);
        (0, vitest_1.expect)((0, artificial_delay_1.getArtificialDelay)(featureFlags, uri, languageId)).toBe(200);
        // after the suggestion was accepted, user latency resets to 0, using baseline only
        (0, artificial_delay_1.resetArtificialDelay)();
        (0, vitest_1.expect)((0, artificial_delay_1.getArtificialDelay)(featureFlags, uri, languageId)).toBe(0);
    });
    (0, vitest_1.it)('returns default latency for CSS after accepting suggestion and resets after 5 minutes', () => {
        const uri = 'file://foo/bar/test.css';
        // css is a low performance language
        const languageId = 'css';
        (0, vitest_1.expect)(artificial_delay_1.lowPerformanceLanguageIds.has(languageId)).toBe(true);
        // start with default baseline latency for low performance lang
        (0, vitest_1.expect)((0, artificial_delay_1.getArtificialDelay)(featureFlags, uri, languageId)).toBe(1000);
        // reset to starting point on every accepted suggestion
        (0, artificial_delay_1.resetArtificialDelay)();
        (0, vitest_1.expect)((0, artificial_delay_1.getArtificialDelay)(featureFlags, uri, languageId)).toBe(1000);
        (0, artificial_delay_1.resetArtificialDelay)();
        (0, vitest_1.expect)((0, artificial_delay_1.getArtificialDelay)(featureFlags, uri, languageId)).toBe(1000);
        (0, vitest_1.expect)((0, artificial_delay_1.getArtificialDelay)(featureFlags, uri, languageId)).toBe(1000);
        // Latency will not reset before 5 minutes
        vitest_1.vi.advanceTimersByTime(3 * 60 * 1000);
        (0, vitest_1.expect)((0, artificial_delay_1.getArtificialDelay)(featureFlags, uri, languageId)).toBe(1000);
        (0, vitest_1.expect)((0, artificial_delay_1.getArtificialDelay)(featureFlags, uri, languageId)).toBe(1000);
        (0, vitest_1.expect)((0, artificial_delay_1.getArtificialDelay)(featureFlags, uri, languageId)).toBe(1000);
        (0, vitest_1.expect)((0, artificial_delay_1.getArtificialDelay)(featureFlags, uri, languageId)).toBe(1050);
        // Latency will be reset after 5 minutes
        vitest_1.vi.advanceTimersByTime(5 * 60 * 1000);
        (0, vitest_1.expect)((0, artificial_delay_1.getArtificialDelay)(featureFlags, uri, languageId)).toBe(1000);
    });
    (0, vitest_1.it)('returns increasing latency up to max after rejecting multiple suggestions, resets after file change and accept', () => {
        const uri = 'file://foo/bar/test.ts';
        const languageId = 'typescript';
        (0, vitest_1.expect)(artificial_delay_1.lowPerformanceLanguageIds.has(languageId)).toBe(false);
        // reject the first 5 suggestions, and confirm latency remains unchanged
        (0, vitest_1.expect)((0, artificial_delay_1.getArtificialDelay)(featureFlags, uri, languageId)).toBe(0);
        (0, vitest_1.expect)((0, artificial_delay_1.getArtificialDelay)(featureFlags, uri, languageId)).toBe(0);
        (0, vitest_1.expect)((0, artificial_delay_1.getArtificialDelay)(featureFlags, uri, languageId)).toBe(0);
        (0, vitest_1.expect)((0, artificial_delay_1.getArtificialDelay)(featureFlags, uri, languageId)).toBe(0);
        (0, vitest_1.expect)((0, artificial_delay_1.getArtificialDelay)(featureFlags, uri, languageId)).toBe(0);
        // latency should start increasing after 5 rejections, but max at 1400
        (0, vitest_1.expect)((0, artificial_delay_1.getArtificialDelay)(featureFlags, uri, languageId)).toBe(50);
        // line is a comment, so latency should be increased where:
        // base is 1000 due to line is a comment, and user latency is 400 as this is the 7th rejection
        (0, vitest_1.expect)((0, artificial_delay_1.getArtificialDelay)(featureFlags, uri, languageId, 'comment')).toBe(1100);
        for (let i = 150; i <= 1400; i += 50) {
            (0, vitest_1.expect)((0, artificial_delay_1.getArtificialDelay)(featureFlags, uri, languageId)).toBe(i);
        }
        // max at 1400 after multiple rejection
        (0, vitest_1.expect)((0, artificial_delay_1.getArtificialDelay)(featureFlags, uri, languageId)).toBe(1400);
        // reset latency on file change to default
        const newUri = 'foo/test.ts';
        // latency should start increasing again after 5 rejections
        (0, vitest_1.expect)((0, artificial_delay_1.getArtificialDelay)(featureFlags, newUri, languageId)).toBe(0);
        (0, vitest_1.expect)((0, artificial_delay_1.getArtificialDelay)(featureFlags, newUri, languageId)).toBe(0);
        // line is a comment, so latency should be increased
        (0, vitest_1.expect)((0, artificial_delay_1.getArtificialDelay)(featureFlags, newUri, languageId, 'comment')).toBe(1000);
        (0, vitest_1.expect)((0, artificial_delay_1.getArtificialDelay)(featureFlags, newUri, languageId)).toBe(0);
        (0, vitest_1.expect)((0, artificial_delay_1.getArtificialDelay)(featureFlags, newUri, languageId)).toBe(0);
        // Latency will not reset before 5 minutes
        vitest_1.vi.advanceTimersByTime(3 * 60 * 1000);
        (0, vitest_1.expect)((0, artificial_delay_1.getArtificialDelay)(featureFlags, newUri, languageId)).toBe(50);
        // reset latency on accepted suggestion
        (0, artificial_delay_1.resetArtificialDelay)();
        (0, vitest_1.expect)((0, artificial_delay_1.getArtificialDelay)(featureFlags, newUri, languageId)).toBe(0);
    });
    (0, vitest_1.it)('returns default latency for low performance language only when only language flag is enabled', () => {
        const uri = 'file://foo/bar/test.css';
        const featureFlagsLangOnly = {
            user: false,
        };
        // css is a low performance language
        const lowPerformLanguageId = 'css';
        (0, vitest_1.expect)(artificial_delay_1.lowPerformanceLanguageIds.has(lowPerformLanguageId)).toBe(true);
        // go is not a low performance language
        const languageId = 'go';
        const goUri = 'foo/bar/test.go';
        (0, vitest_1.expect)(artificial_delay_1.lowPerformanceLanguageIds.has(languageId)).toBe(false);
        // latency should only change based on language id when only the language flag is enabled
        (0, vitest_1.expect)((0, artificial_delay_1.getArtificialDelay)(featureFlagsLangOnly, uri, lowPerformLanguageId)).toBe(1000);
        (0, vitest_1.expect)((0, artificial_delay_1.getArtificialDelay)(featureFlagsLangOnly, uri, lowPerformLanguageId)).toBe(1000);
        (0, vitest_1.expect)((0, artificial_delay_1.getArtificialDelay)(featureFlagsLangOnly, uri, lowPerformLanguageId)).toBe(1000);
        (0, vitest_1.expect)((0, artificial_delay_1.getArtificialDelay)(featureFlagsLangOnly, uri, lowPerformLanguageId)).toBe(1000);
        (0, vitest_1.expect)((0, artificial_delay_1.getArtificialDelay)(featureFlagsLangOnly, uri, lowPerformLanguageId)).toBe(1000);
        (0, vitest_1.expect)((0, artificial_delay_1.getArtificialDelay)(featureFlagsLangOnly, uri, lowPerformLanguageId)).toBe(1000);
        // latency back to 0 when language is no longer low-performance
        (0, vitest_1.expect)((0, artificial_delay_1.getArtificialDelay)(featureFlagsLangOnly, goUri, languageId)).toBe(0);
    });
    (0, vitest_1.it)('returns latency based on language only when user flag is disabled', () => {
        const uri = 'file://foo/bar/test.css';
        // css is a low performance language
        const languageId = 'css';
        (0, vitest_1.expect)(artificial_delay_1.lowPerformanceLanguageIds.has(languageId)).toBe(true);
        const featureFlagsNoUser = {
            user: false,
        };
        // latency starts with language latency
        (0, vitest_1.expect)((0, artificial_delay_1.getArtificialDelay)(featureFlagsNoUser, uri, languageId)).toBe(1000);
        (0, vitest_1.expect)((0, artificial_delay_1.getArtificialDelay)(featureFlagsNoUser, uri, languageId)).toBe(1000);
        (0, vitest_1.expect)((0, artificial_delay_1.getArtificialDelay)(featureFlagsNoUser, uri, languageId)).toBe(1000);
        (0, vitest_1.expect)((0, artificial_delay_1.getArtificialDelay)(featureFlagsNoUser, uri, languageId)).toBe(1000);
        (0, vitest_1.expect)((0, artificial_delay_1.getArtificialDelay)(featureFlagsNoUser, uri, languageId)).toBe(1000);
        // latency should remains unchanged after 5 rejections
        (0, vitest_1.expect)((0, artificial_delay_1.getArtificialDelay)(featureFlagsNoUser, uri, languageId)).toBe(1000);
        (0, vitest_1.expect)((0, artificial_delay_1.getArtificialDelay)(featureFlagsNoUser, uri, languageId)).toBe(1000);
        (0, vitest_1.expect)((0, artificial_delay_1.getArtificialDelay)(featureFlagsNoUser, uri, languageId)).toBe(1000);
        // switch to a non-low-performance language - go is not a low performance language
        const goLanguageId = 'go';
        const goUri = 'foo/bar/test.go';
        (0, vitest_1.expect)(artificial_delay_1.lowPerformanceLanguageIds.has(goLanguageId)).toBe(false);
        // reset to provider latency because language latency is ignored for non-low-performance languages
        (0, vitest_1.expect)((0, artificial_delay_1.getArtificialDelay)(featureFlagsNoUser, goUri, goLanguageId)).toBe(0);
    });
});
