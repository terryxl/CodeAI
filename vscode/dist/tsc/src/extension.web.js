"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = void 0;
const cody_shared_1 = require("@sourcegraph/cody-shared");
const extension_common_1 = require("./extension.common");
const sentry_web_1 = require("./services/sentry/sentry.web");
/**
 * Activation entrypoint for the VS Code extension when running in VS Code Web (https://vscode.dev,
 * https://github.dev, etc.).
 */
function activate(context) {
    return (0, extension_common_1.activate)(context, {
        createCompletionsClient: (...args) => new cody_shared_1.SourcegraphBrowserCompletionsClient(...args),
        createSentryService: (...args) => new sentry_web_1.WebSentryService(...args),
    });
}
exports.activate = activate;
