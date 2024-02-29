// Default Cody Commands that runs as a Chat request
export var DefaultChatCommands;
(function (DefaultChatCommands) {
    DefaultChatCommands["Explain"] = "explain";
    DefaultChatCommands["Unit"] = "unit";
    DefaultChatCommands["Smell"] = "smell";
    DefaultChatCommands["Terminal"] = "terminal";
})(DefaultChatCommands || (DefaultChatCommands = {}));
// Default Cody Commands that runs as an Inline Edit command
export var DefaultEditCommands;
(function (DefaultEditCommands) {
    DefaultEditCommands["Test"] = "test";
    DefaultEditCommands["Doc"] = "doc";
})(DefaultEditCommands || (DefaultEditCommands = {}));
export var CustomCommandType;
(function (CustomCommandType) {
    CustomCommandType["Workspace"] = "workspace";
    CustomCommandType["User"] = "user";
})(CustomCommandType || (CustomCommandType = {}));
//# sourceMappingURL=types.js.map