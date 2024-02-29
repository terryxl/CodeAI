"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Provider = exports.standardContextSizeHints = void 0;
const cody_shared_1 = require("@sourcegraph/cody-shared");
function standardContextSizeHints(maxContextTokens) {
    return {
        totalChars: Math.floor((0, cody_shared_1.tokensToChars)(0.9 * maxContextTokens)), // keep 10% margin for preamble, etc.
        prefixChars: Math.floor((0, cody_shared_1.tokensToChars)(0.6 * maxContextTokens)),
        suffixChars: Math.floor((0, cody_shared_1.tokensToChars)(0.1 * maxContextTokens)),
    };
}
exports.standardContextSizeHints = standardContextSizeHints;
class Provider {
    options;
    constructor(options) {
        this.options = options;
    }
}
exports.Provider = Provider;
