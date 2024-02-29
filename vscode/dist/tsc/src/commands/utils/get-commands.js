"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.newCodyCommandArgs = exports.buildCodyCommandMap = exports.getDefaultCommandsMap = void 0;
const uuid = __importStar(require("uuid"));
const execute_1 = require("../execute");
function getDefaultCommandsMap(editorCommands = []) {
    const map = new Map();
    // Add editor specific commands
    for (const command of editorCommands) {
        if (command.key) {
            map.set(command.key, command);
        }
    }
    // Add default commands
    const fileContent = JSON.stringify(execute_1.defaultCommands);
    const mapFromJson = buildCodyCommandMap('default', fileContent);
    // combine the two maps
    return new Map([...map, ...mapFromJson]);
}
exports.getDefaultCommandsMap = getDefaultCommandsMap;
/**
 * Builds a map of CodyCommands with content from a JSON file.
 * @param type The type of commands being built.
 * @param fileContent The contents of the cody.json file.
 */
function buildCodyCommandMap(type, fileContent) {
    const map = new Map();
    const parsed = JSON.parse(fileContent);
    // Check if parsed has a "commands" key and use that as the root
    // If it doesn't, use the root as the root
    const commands = parsed.commands ?? parsed;
    for (const key in commands) {
        const command = commands[key];
        // Skip adding the command if it doesn't have a prompt
        if (!command.prompt) {
            continue;
        }
        command.type = type;
        // NOTE: we no longer support slash commands, this is for backward compatibility
        command.key = key;
        // Set default mode to ask unless it's an edit command
        command.mode = command.mode ?? 'ask';
        map.set(command.key, command);
    }
    return map;
}
exports.buildCodyCommandMap = buildCodyCommandMap;
/**
 * Creates a CodyCommandArgs object with default values.
 * Generates a random requestID if one is not provided.
 * Merges any provided args with the defaults.
 */
function newCodyCommandArgs(args = {}) {
    return {
        requestID: args.requestID ?? uuid.v4(),
        ...args,
    };
}
exports.newCodyCommandArgs = newCodyCommandArgs;
