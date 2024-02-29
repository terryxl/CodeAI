import type { ContextMessage } from '@sourcegraph/cody-shared';
import type { ContextItem } from '../../prompt-builder/types';
/**
 * Extract `ContextItems` from `ContextMessages` for interoperability
 * between existing context mechanisms in the codebase.
 *
 * TODO: These types are ultimately very similar, we should refactor this so we
 * can avoid maintaining both types.
 */
export declare const extractContextItemsFromContextMessages: (contextMessages: ContextMessage[]) => ContextItem[];
//# sourceMappingURL=utils.d.ts.map