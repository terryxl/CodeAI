"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOSArch = void 0;
const os_1 = __importDefault(require("os"));
function getOSArch() {
    const nodePlatformToPlatform = {
        darwin: 'macos',
        linux: 'linux',
        win32: 'windows',
    };
    const nodeMachineToArch = {
        arm64: 'aarch64',
        aarch64: 'aarch64',
        x86_64: 'x86_64',
        x64: 'x86_64',
        i386: 'x86',
        i686: 'x86',
    };
    let platform;
    try {
        platform = nodePlatformToPlatform[os_1.default.platform()];
    }
    catch {
        // Ignore errors
    }
    let arch;
    try {
        arch = nodeMachineToArch[os_1.default.arch()];
    }
    catch {
        // Ignore errors
    }
    return {
        platform,
        arch,
    };
}
exports.getOSArch = getOSArch;
