"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.editModel = exports.chatModel = void 0;
const LocalStorageProvider_1 = require("../services/LocalStorageProvider");
const dotcom_1 = require("@sourcegraph/cody-shared/src/models/dotcom");
async function setModel(modelID, storageKey) {
    // Store the selected model in local storage to retrieve later
    return LocalStorageProvider_1.localStorage.set(storageKey, modelID);
}
function getCustomModel(authProvider, models, storageKey) {
    const model = getModel(authProvider, models, storageKey);
    return (models || dotcom_1.DEFAULT_DOT_COM_MODELS).find(m => m.model === model);
}
function getModel(authProvider, models, storageKey) {
    const authStatus = authProvider.getAuthStatus();
    // Free user can only use the default model
    if (authStatus.isDotCom && authStatus.userCanUpgrade) {
        return models[0].model;
    }
    // Enterprise user can only use the default model
    // We only support a single model for enterprise users right now
    if (!authStatus.isDotCom) {
        return models[0].model;
    }
    // Check for the last selected model
    const lastSelectedModelID = LocalStorageProvider_1.localStorage.get(storageKey);
    if (lastSelectedModelID) {
        // If the last selected model exists in the list of models then we return it
        const model = models.find(m => m.model === lastSelectedModelID);
        if (model) {
            return lastSelectedModelID;
        }
    }
    // If the user has not selected a model before then we return the default model
    const defaultModel = models.find(m => m.default) || models[0];
    if (!defaultModel) {
        throw new Error('No chat model found in server-provided config');
    }
    return defaultModel.model;
}
function createModelAccessor(storageKey) {
    return {
        get: (authProvider, models) => getModel(authProvider, models, storageKey),
        getModel: (authProvider, models) => getCustomModel(authProvider, models, storageKey),
        set: (modelID) => setModel(modelID, storageKey),
    };
}
exports.chatModel = createModelAccessor('model');
exports.editModel = createModelAccessor('editModel');
