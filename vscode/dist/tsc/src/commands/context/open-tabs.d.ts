import { type ContextFile } from '@sourcegraph/cody-shared';
/**
 * Gets context files from the currently open tabs.
 *
 * Iterates through all open tabs, filters to only file tabs in the workspace,
 * and then creates ContextFile objects for each valid tab.
 */
export declare function getContextFileFromTabs(): Promise<ContextFile[]>;
//# sourceMappingURL=open-tabs.d.ts.map