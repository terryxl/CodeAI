import type { ChatModel, EditModel, ModelProvider } from '@sourcegraph/cody-shared';
import type { AuthProvider } from '../services/AuthProvider';
export declare const chatModel: {
    get: (authProvider: AuthProvider, models: ModelProvider[]) => ChatModel;
    getModel: (authProvider: AuthProvider, models: ModelProvider[]) => ModelProvider;
    set: (modelID: ChatModel) => Promise<void>;
};
export declare const editModel: {
    get: (authProvider: AuthProvider, models: ModelProvider[]) => EditModel;
    getModel: (authProvider: AuthProvider, models: ModelProvider[]) => ModelProvider;
    set: (modelID: EditModel) => Promise<void>;
};
//# sourceMappingURL=index.d.ts.map