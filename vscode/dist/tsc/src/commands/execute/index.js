"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.executeDefaultCommand = exports.isDefaultEditCommand = exports.isDefaultChatCommand = exports.executeExplainOutput = exports.executeTestCaseEditCommand = exports.executeTestEditCommand = exports.executeDocCommand = exports.executeTestChatCommand = exports.executeExplainCommand = exports.executeSmellCommand = exports.defaultCommands = void 0;
const types_1 = require("@sourcegraph/cody-shared/src/commands/types");
const smell_1 = require("./smell");
const explain_1 = require("./explain");
const test_chat_1 = require("./test-chat");
const doc_1 = require("./doc");
const test_edit_1 = require("./test-edit");
var cody_json_1 = require("./cody.json");
Object.defineProperty(exports, "defaultCommands", { enumerable: true, get: function () { return cody_json_1.commands; } });
var smell_2 = require("./smell");
Object.defineProperty(exports, "executeSmellCommand", { enumerable: true, get: function () { return smell_2.executeSmellCommand; } });
var explain_2 = require("./explain");
Object.defineProperty(exports, "executeExplainCommand", { enumerable: true, get: function () { return explain_2.executeExplainCommand; } });
var test_chat_2 = require("./test-chat");
Object.defineProperty(exports, "executeTestChatCommand", { enumerable: true, get: function () { return test_chat_2.executeTestChatCommand; } });
var doc_2 = require("./doc");
Object.defineProperty(exports, "executeDocCommand", { enumerable: true, get: function () { return doc_2.executeDocCommand; } });
var test_edit_2 = require("./test-edit");
Object.defineProperty(exports, "executeTestEditCommand", { enumerable: true, get: function () { return test_edit_2.executeTestEditCommand; } });
var test_case_1 = require("./test-case");
Object.defineProperty(exports, "executeTestCaseEditCommand", { enumerable: true, get: function () { return test_case_1.executeTestCaseEditCommand; } });
var terminal_1 = require("./terminal");
Object.defineProperty(exports, "executeExplainOutput", { enumerable: true, get: function () { return terminal_1.executeExplainOutput; } });
function isDefaultChatCommand(id) {
    // Remove leading slash if any
    const key = id.replace(/^\//, '').trim();
    if (Object.values(types_1.DefaultChatCommands).includes(key)) {
        return key;
    }
    return undefined;
}
exports.isDefaultChatCommand = isDefaultChatCommand;
function isDefaultEditCommand(id) {
    // Remove leading slash if any
    const key = id.replace(/^\//, '').trim();
    if (Object.values(types_1.DefaultEditCommands).includes(key)) {
        return key;
    }
    return undefined;
}
exports.isDefaultEditCommand = isDefaultEditCommand;
/**
 * Executes the default command based on the given arguments.
 * Handles mapping chat commands and edit commands to their respective handler functions.
 * Returns the command result if a matched command is found, otherwise returns undefined.
 */
async function executeDefaultCommand(id, additionalInstruction) {
    const key = id.replace(/^\//, '').trim();
    switch (key) {
        case types_1.DefaultChatCommands.Explain:
            return (0, explain_1.executeExplainCommand)({ additionalInstruction });
        case types_1.DefaultChatCommands.Smell:
            return (0, smell_1.executeSmellCommand)({ additionalInstruction });
        case types_1.DefaultChatCommands.Unit:
            return (0, test_chat_1.executeTestChatCommand)({ additionalInstruction });
        case types_1.DefaultEditCommands.Test:
            return (0, test_edit_1.executeTestEditCommand)({ additionalInstruction });
        case types_1.DefaultEditCommands.Doc:
            return (0, doc_1.executeDocCommand)({ additionalInstruction });
        default:
            console.log('not a default command');
            return undefined;
    }
}
exports.executeDefaultCommand = executeDefaultCommand;
