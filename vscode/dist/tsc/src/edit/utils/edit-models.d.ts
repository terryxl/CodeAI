import { ModelProvider } from '@sourcegraph/cody-shared';
import { type EditModel } from '@sourcegraph/cody-shared/src/models/types';
import type { EditIntent } from '../types';
import type { AuthStatus } from '../../chat/protocol';
export declare function getEditModelsForUser(authStatus: AuthStatus): ModelProvider[];
export declare function getOverridenModelForIntent(intent: EditIntent, currentModel: EditModel): EditModel;
//# sourceMappingURL=edit-models.d.ts.map