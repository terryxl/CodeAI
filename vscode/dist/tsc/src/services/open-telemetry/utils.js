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
exports.recordExposedExperimentsToSpan = void 0;
const cody_shared_1 = require("@sourcegraph/cody-shared");
const configuration_1 = require("../../configuration");
const vscode = __importStar(require("vscode"));
const telemetry_1 = require("../telemetry");
// Ensure to ad exposed experiments at the very end to make sure we include experiments that the
// user is being exposed to while the span was generated
function recordExposedExperimentsToSpan(span) {
    span.setAttributes(cody_shared_1.featureFlagProvider.getExposedExperiments());
    const extensionDetails = (0, telemetry_1.getExtensionDetails)((0, configuration_1.getConfiguration)(vscode.workspace.getConfiguration()));
    span.setAttributes(extensionDetails);
    const extensionApi = vscode.extensions.getExtension('sourcegraph.cody-ai')?.exports;
    if (extensionApi && extensionDetails.ide === 'VSCode') {
        const vscodeChannel = extensionApi.extensionMode === vscode.ExtensionMode.Development
            ? 'development'
            : extensionApi.extensionMode === vscode.ExtensionMode.Test
                ? 'test'
                : inferVSCodeChannelFromVersion(extensionDetails.version);
        span.setAttribute('vscodeChannel', vscodeChannel);
    }
}
exports.recordExposedExperimentsToSpan = recordExposedExperimentsToSpan;
function inferVSCodeChannelFromVersion(version) {
    const [, , patch] = version.split('.').map(Number);
    if (patch > 1000) {
        return 'pre-release';
    }
    return 'release';
}
