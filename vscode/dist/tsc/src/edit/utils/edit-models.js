"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOverridenModelForIntent = exports.getEditModelsForUser = void 0;
const cody_shared_1 = require("@sourcegraph/cody-shared");
const types_1 = require("@sourcegraph/cody-shared/src/models/types");
function getEditModelsForUser(authStatus) {
    if (authStatus?.configOverwrites?.chatModel) {
        cody_shared_1.ModelProvider.add(new cody_shared_1.ModelProvider(authStatus.configOverwrites.chatModel, [
            types_1.ModelUsage.Chat,
            // TODO: Add configOverwrites.editModel for separate edit support
            types_1.ModelUsage.Edit,
        ]));
    }
    return cody_shared_1.ModelProvider.get(types_1.ModelUsage.Edit, authStatus.endpoint);
}
exports.getEditModelsForUser = getEditModelsForUser;
function getOverridenModelForIntent(intent, currentModel) {
    switch (intent) {
        case 'doc':
        case 'fix':
        case 'test':
            // Edit commands have only been tested with Claude 2. Default to that for now.
            return 'anthropic/claude-2.0';
        case 'add':
        case 'edit':
            // Support all model usage for add and edit intents.
            return currentModel;
    }
}
exports.getOverridenModelForIntent = getOverridenModelForIntent;
