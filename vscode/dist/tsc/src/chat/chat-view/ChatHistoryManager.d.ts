import type { ChatInputHistory, TranscriptJSON, UserLocalHistory } from '@sourcegraph/cody-shared';
import type { AuthStatus } from '../protocol';
export declare class ChatHistoryManager {
    getLocalHistory(authStatus: AuthStatus): UserLocalHistory | null;
    getChat(authStatus: AuthStatus, sessionID: string): TranscriptJSON | null;
    saveChat(authStatus: AuthStatus, chat: TranscriptJSON, input?: ChatInputHistory): Promise<UserLocalHistory>;
    deleteChat(authStatus: AuthStatus, chatID: string): Promise<void>;
    clear(authStatus: AuthStatus): Promise<void>;
}
export declare const chatHistory: ChatHistoryManager;
//# sourceMappingURL=ChatHistoryManager.d.ts.map