import type { ExtensionMessage, WebviewMessage } from '../../src/chat/protocol';
export interface VSCodeWrapper {
    postMessage(message: WebviewMessage): void;
    onMessage(callback: (message: ExtensionMessage) => void): () => void;
    getState(): unknown;
    setState(newState: unknown): void;
}
export declare function getVSCodeAPI(): VSCodeWrapper;
//# sourceMappingURL=VSCodeApi.d.ts.map