"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExtensionApi = void 0;
const test_support_1 = require("./test-support");
// The API surface exported to other extensions.
class ExtensionApi {
    extensionMode;
    // Hooks for extension test support. This is only set if the
    // environment contains CODY_TESTING=true . This is only for
    // testing and the API will change.
    testing = undefined;
    constructor(extensionMode) {
        this.extensionMode = extensionMode;
        if (process.env.CODY_TESTING === 'true') {
            console.warn('Setting up testing hooks');
            this.testing = new test_support_1.TestSupport();
            test_support_1.TestSupport.instance = this.testing;
        }
    }
}
exports.ExtensionApi = ExtensionApi;
