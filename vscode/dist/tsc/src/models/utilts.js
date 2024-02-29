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
exports.getContextWindowForModel = void 0;
const vscode = __importStar(require("vscode"));
const cody_shared_1 = require("@sourcegraph/cody-shared");
function getContextWindowForModel(authStatus, modelID) {
    // In enterprise mode, we let the sg instance dictate the token limits and allow users to
    // overwrite it locally (for debugging purposes).
    //
    // This is similiar to the behavior we had before introducing the new chat and allows BYOK
    // customers to set a model of their choice without us having to map it to a known model on
    // the client.
    if (authStatus.endpoint && !(0, cody_shared_1.isDotCom)(authStatus.endpoint)) {
        const codyConfig = vscode.workspace.getConfiguration('cody');
        const tokenLimit = codyConfig.get('provider.limit.prompt');
        if (tokenLimit) {
            return tokenLimit * 4; // bytes per token
        }
        if (authStatus.configOverwrites?.chatModelMaxTokens) {
            return authStatus.configOverwrites.chatModelMaxTokens * 4; // bytes per token
        }
        return 28000; // 7000 tokens * 4 bytes per token
    }
    if (modelID === 'openai/gpt-4-1106-preview') {
        return 28000; // 7000 tokens * 4 bytes per token
    }
    if (modelID === 'openai/gpt-3.5-turbo') {
        return 10000; // 4,096 tokens * < 4 bytes per token
    }
    if (modelID === 'fireworks/accounts/fireworks/models/mixtral-8x7b-instruct') {
        return 28000; // 7000 tokens * 4 bytes per token
    }
    return 28000; // assume default to Claude-2-like model
}
exports.getContextWindowForModel = getContextWindowForModel;
