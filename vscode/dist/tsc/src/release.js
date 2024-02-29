"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.releaseNotesURL = exports.releaseType = exports.majorMinorVersion = void 0;
const majorVersion = (version) => version.split('.')[0];
const minorVersion = (version) => version.split('.')[1];
const majorMinorVersion = (version) => [majorVersion(version), minorVersion(version)].join('.');
exports.majorMinorVersion = majorMinorVersion;
const releaseType = (version) => Number(minorVersion(version)) % 2 === 1 ? 'insiders' : 'stable';
exports.releaseType = releaseType;
const releaseNotesURL = (version) => (0, exports.releaseType)(version) === 'stable'
    ? `https://github.com/sourcegraph/cody/releases/tag/vscode-v${version}`
    : 'https://github.com/sourcegraph/cody/blob/main/vscode/CHANGELOG.md';
exports.releaseNotesURL = releaseNotesURL;
