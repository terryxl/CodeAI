"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerChangeListener = exports.logAccepted = exports.logSuggested = exports.getStatistics = void 0;
const utils_1 = require("./utils");
const subscriber = (0, utils_1.createSubscriber)();
let statistics = {
    suggested: 0,
    accepted: 0,
};
function getStatistics() {
    return statistics;
}
exports.getStatistics = getStatistics;
function logSuggested() {
    statistics = { ...statistics, suggested: statistics.suggested + 1 };
    subscriber.notify();
}
exports.logSuggested = logSuggested;
function logAccepted() {
    statistics = { ...statistics, accepted: statistics.accepted + 1 };
    subscriber.notify();
}
exports.logAccepted = logAccepted;
exports.registerChangeListener = subscriber.subscribe.bind(subscriber);
