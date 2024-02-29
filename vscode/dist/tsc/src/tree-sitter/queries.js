"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.languages = exports.intentPriority = void 0;
const go_1 = require("./queries/go");
const javascript_1 = require("./queries/javascript");
const python_1 = require("./queries/python");
/**
 * Completion intents sorted by priority.
 * Top-most items are used if capture group ranges are identical.
 */
exports.intentPriority = [
    'function.name',
    'function.parameters',
    'function.body',
    'type_declaration.name',
    'type_declaration.body',
    'arguments',
    'import.source',
    'comment',
    'pair.value',
    'argument',
    'parameter',
    'parameters',
    'jsx_attribute.value',
    'return_statement.value',
    'return_statement',
    'string',
];
exports.languages = {
    ...javascript_1.javascriptQueries,
    ...go_1.goQueries,
    ...python_1.pythonQueries,
};
