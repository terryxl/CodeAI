// IMPORTANT: This file MUST have minimal imports because we need to be able to
// use these loggers everywhere, including during early initialization of the
// process. Be very conservative about adding imports to modules that perform
// any kind of side effect.
const consoleLogger = {
    logDebug(filterLabel, text, ...args) {
        console.log(`${filterLabel}:${text}`, ...args);
    },
    logError(filterLabel, text, ...args) {
        console.log(`${filterLabel}:${text}`, ...args);
    },
};
let _logger = consoleLogger;
export function setLogger(newLogger) {
    _logger = newLogger;
}
export function logDebug(filterLabel, text, ...args) {
    _logger.logDebug(filterLabel, text, ...args);
}
export function logError(filterLabel, text, ...args) {
    _logger.logError(filterLabel, text, ...args);
}
//# sourceMappingURL=logger.js.map