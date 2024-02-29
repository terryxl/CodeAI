import type { AuthStatus } from '../chat/protocol';
import type { CodySidebarTreeItem } from './treeViewItems';
interface GroupedChats {
    [groupName: string]: CodySidebarTreeItem[];
}
export declare function groupCodyChats(authStatus: AuthStatus | undefined): GroupedChats | null;
export declare function displayHistoryQuickPick(authStatus: AuthStatus): Promise<void>;
export {};
//# sourceMappingURL=HistoryChat.d.ts.map