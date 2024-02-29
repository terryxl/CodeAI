"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomCommandConfigFile = exports.CommandMenuAction = void 0;
var CommandMenuAction;
(function (CommandMenuAction) {
    CommandMenuAction["Add"] = "add";
    CommandMenuAction["File"] = "file";
    CommandMenuAction["Delete"] = "delete";
    CommandMenuAction["List"] = "list";
    CommandMenuAction["Open"] = "open";
    CommandMenuAction["Cancel"] = "cancel";
    CommandMenuAction["Docs"] = "docs";
    CommandMenuAction["Back"] = "back";
    CommandMenuAction["Command"] = "command";
    CommandMenuAction["Config"] = "config";
})(CommandMenuAction || (exports.CommandMenuAction = CommandMenuAction = {}));
var CustomCommandConfigFile;
(function (CustomCommandConfigFile) {
    CustomCommandConfigFile["User"] = "~/.vscode/cody.json";
    CustomCommandConfigFile["Workspace"] = ".vscode/cody.json";
})(CustomCommandConfigFile || (exports.CustomCommandConfigFile = CustomCommandConfigFile = {}));
