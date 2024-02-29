"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetArtificialDelay = exports.getArtificialDelay = exports.lowPerformanceLanguageIds = void 0;
const log_1 = require("../log");
const defaultLatencies = {
    user: 50,
    lowPerformance: 1000,
    max: 1400,
};
// Languages with lower performance get additional latency to avoid spamming users with unhelpful
// suggestions
exports.lowPerformanceLanguageIds = new Set([
    'css',
    'html',
    'scss',
    'vue',
    'dart',
    'json',
    'yaml',
    'postcss',
    'markdown',
    'plaintext',
    'xml',
    'twig',
    'jsonc',
    'handlebars',
]);
const lowPerformanceCompletionIntents = new Set(['comment', 'import.source']);
let userMetrics = {
    sessionTimestamp: 0,
    currentLatency: 0,
    suggested: 0,
    uri: '',
};
// Adjust the minimum latency based on user actions and env Start when the last 5 suggestions were
// not accepted Increment latency by 200ms linearly up to max latency Reset every 5 minutes, or on
// file change, or on accepting a suggestion
function getArtificialDelay(featureFlags, uri, languageId, completionIntent) {
    let baseline = 0;
    const isLowPerformanceLanguageId = exports.lowPerformanceLanguageIds.has(languageId);
    const isLowPerformanceCompletionIntent = completionIntent && lowPerformanceCompletionIntents.has(completionIntent);
    if (isLowPerformanceLanguageId || isLowPerformanceCompletionIntent) {
        baseline = defaultLatencies.lowPerformance;
    }
    const timestamp = Date.now();
    if (!userMetrics.sessionTimestamp) {
        userMetrics.sessionTimestamp = timestamp;
    }
    const elapsed = timestamp - userMetrics.sessionTimestamp;
    // reset metrics and timer after 5 minutes or file change
    if (elapsed >= 5 * 60 * 1000 || userMetrics.uri !== uri) {
        resetArtificialDelay(timestamp);
    }
    userMetrics.suggested++;
    userMetrics.uri = uri;
    const total = Math.max(baseline, Math.min(baseline + userMetrics.currentLatency, defaultLatencies.max));
    // Increase latency linearly up to max after 5 rejected suggestions
    if (userMetrics.suggested >= 5 && userMetrics.currentLatency < defaultLatencies.max) {
        userMetrics.currentLatency += featureFlags.user ? defaultLatencies.user : 0;
    }
    if (total > 0) {
        (0, log_1.logDebug)('CodyCompletionProvider:getLatency', `Delay added: ${total}`);
    }
    return total;
}
exports.getArtificialDelay = getArtificialDelay;
// reset user latency and counter:
// - on acceptance
// - every 5 minutes
// - on file change
function resetArtificialDelay(timestamp = 0) {
    userMetrics = {
        sessionTimestamp: timestamp,
        currentLatency: 0,
        suggested: 0,
        uri: '',
    };
}
exports.resetArtificialDelay = resetArtificialDelay;
