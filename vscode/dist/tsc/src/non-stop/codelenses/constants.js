"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ALL_ACTIONABLE_TASK_STATES = exports.ACTIONABLE_TASK_STATES = exports.CANCELABLE_TASK_STATES = void 0;
const utils_1 = require("../utils");
exports.CANCELABLE_TASK_STATES = [
    utils_1.CodyTaskState.pending,
    utils_1.CodyTaskState.working,
    utils_1.CodyTaskState.inserting,
    utils_1.CodyTaskState.applying,
];
exports.ACTIONABLE_TASK_STATES = [
    // User can Accept, Undo, Retry, etc
    utils_1.CodyTaskState.applied,
];
/**
 * The task states where there is a direct command that the users is likely to action.
 * This is used to help enable/disable keyboard shortcuts depending on the states in the document
 */
exports.ALL_ACTIONABLE_TASK_STATES = [...exports.ACTIONABLE_TASK_STATES, ...exports.CANCELABLE_TASK_STATES];
