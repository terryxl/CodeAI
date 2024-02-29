import type { ChatMessage } from '@sourcegraph/cody-shared';
import type { SimpleChatPanelProvider } from './chat/chat-view/SimpleChatPanelProvider';
import type { IgnoreHelper } from '@sourcegraph/cody-shared/src/cody-ignore/ignore-helper';
declare class Rendezvous<T> {
    private resolve;
    private promise;
    constructor();
    set(value: T): void;
    get(): Promise<T>;
}
export declare class TestSupport {
    static instance: TestSupport | undefined;
    chatPanelProvider: Rendezvous<SimpleChatPanelProvider>;
    ignoreHelper: Rendezvous<IgnoreHelper>;
    chatMessages(): Promise<ChatMessage[]>;
}
export {};
//# sourceMappingURL=test-support.d.ts.map