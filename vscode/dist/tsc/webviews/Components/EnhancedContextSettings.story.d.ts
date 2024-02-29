import type { Meta, StoryObj } from '@storybook/react';
import { EnhancedContextPresentationMode, EnhancedContextSettings } from './EnhancedContextSettings';
declare const meta: Meta<typeof EnhancedContextSettings>;
export default meta;
interface SingleTileArgs {
    isOpen: boolean;
    presentationMode: EnhancedContextPresentationMode;
    name: string;
    kind: 'embeddings' | 'search';
    type: 'local' | 'remote';
    state: 'indeterminate' | 'unconsented' | 'indexing' | 'ready' | 'no-match';
    id: string;
    inclusion: 'auto' | 'manual';
}
export declare const SingleTile: StoryObj<typeof EnhancedContextSettings | SingleTileArgs>;
export declare const ConsumerMultipleProviders: StoryObj<typeof EnhancedContextSettings>;
export declare const EnterpriseNoRepositories: StoryObj<typeof EnhancedContextSettings>;
export declare const EnterpriseMultipleRepositories: StoryObj<typeof EnhancedContextSettings>;
//# sourceMappingURL=EnhancedContextSettings.story.d.ts.map