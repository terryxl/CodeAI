import type { GetItemsResult } from '../quick-pick';
import type { EditModelItem } from './types';
import type { EditModel, ModelProvider } from '@sourcegraph/cody-shared';
export declare const getModelProviderIcon: (provider: string) => string;
export declare const getModelOptionItems: (modelOptions: ModelProvider[], isCodyPro: boolean) => EditModelItem[];
export declare const getModelInputItems: (modelOptions: ModelProvider[], activeModel: EditModel, isCodyPro: boolean) => GetItemsResult;
//# sourceMappingURL=model.d.ts.map