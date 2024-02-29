"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addAutocompleteDebugEvent = void 0;
const api_1 = require("@opentelemetry/api");
/**
 * Adds OpenTelemetry event to the current active span in the development environment.
 * Does nothing in production environments.
 *
 * If `currentLinePrefix` and `text` attributes are present,
 * merges them into one formatted attribute (useful for autocomplete events logging).
 */
const addAutocompleteDebugEvent = (name, attributes = {}) => {
    if (process.env.NODE_ENV === 'development') {
        const activeSpan = api_1.trace.getActiveSpan();
        const { currentLinePrefix, text, ...rest } = attributes;
        if (typeof currentLinePrefix === 'string' && typeof text === 'string') {
            const formattedText = `${currentLinePrefix}█${text.trimStart()}`;
            return activeSpan?.addEvent(name, { text: formattedText, ...rest });
        }
        return activeSpan?.addEvent(name, attributes);
    }
    return undefined;
};
exports.addAutocompleteDebugEvent = addAutocompleteDebugEvent;
