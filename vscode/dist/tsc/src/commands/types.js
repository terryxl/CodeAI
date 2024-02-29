"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigFiles = void 0;
/**
 * The name of the file for configuring Custom Commands.
 */
var ConfigFiles;
(function (ConfigFiles) {
    // Cody Commands config file location in VS CODE
    // TODO: Migrate to use the one in /.cody
    ConfigFiles["VSCODE"] = ".vscode/cody.json";
    // Cody Commands config file location for all clients
    ConfigFiles["COMMAND"] = ".cody/commands.json";
})(ConfigFiles || (exports.ConfigFiles = ConfigFiles = {}));
