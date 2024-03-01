"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCodyTreeItems = void 0;
const release_1 = require("../release");
const version_1 = require("../version");
const commands_1 = require("../commands");
/**
 * Gets the tree view items to display based on the provided type.
 */
function getCodyTreeItems(type) {
    switch (type) {
        case "command":
            return (0, commands_1.getCommandTreeItems)();
        case "support":
            return supportItems;
        default:
            return [];
    }
}
exports.getCodyTreeItems = getCodyTreeItems;
const supportItems = [
    {
        title: "Upgrade",
        description: "Upgrade to Pro",
        icon: "zap",
        command: { command: "cody.show-page", args: ["upgrade"] },
        requireDotCom: true,
        requireUpgradeAvailable: true,
    },
    {
        title: "Usage",
        icon: "pulse",
        command: { command: "cody.show-page", args: ["usage"] },
        requireDotCom: true,
    },
    {
        title: "Settings",
        icon: "settings-gear",
        command: { command: "cody.sidebar.settings" },
    },
    {
        title: "Keyboard Shortcuts",
        icon: "keyboard",
        command: { command: "cody.sidebar.keyboardShortcuts" },
    },
    {
        title: `${(0, release_1.releaseType)(version_1.version) === "stable" ? "Release" : "Pre-Release"} Notes`,
        description: `v${version_1.version}`,
        icon: "github",
        command: { command: "cody.sidebar.releaseNotes" },
    },
    {
        title: "Documentation",
        icon: "book",
        command: { command: "cody.sidebar.documentation" },
    },
    {
        title: "Feedback",
        icon: "feedback",
        command: { command: "cody.sidebar.feedback" },
    },
    {
        title: "Discord",
        icon: "organization",
        command: { command: "cody.sidebar.discord" },
    },
    {
        title: "Account",
        icon: "account",
        command: { command: "cody.sidebar.account" },
    },
];
