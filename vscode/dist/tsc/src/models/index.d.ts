import type { ChatModel, EditModel, ModelProvider } from '@sourcegraph/cody-shared';
import type { AuthProvider } from '../services/AuthProvider';
export declare const chatModel: {
    get: (authProvider: AuthProvider, models: ModelProvider[]) => ChatModel;
    set: (modelID: ChatModel) => Promise<void>;
};
export declare const editModel: {
    get: (authProvider: AuthProvider, models: ModelProvider[]) => EditModel;
    set: (modelID: EditModel) => Promise<void>;
};
//# sourceMappingURL=index.d.ts.map