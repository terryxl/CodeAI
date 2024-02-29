import type React from 'react';
import type { ChatInputHistory, ChatMessage, ModelProvider, ContextFile, Guardrails, TelemetryService } from '@sourcegraph/cody-shared';
import { type UserAccountInfo } from '@sourcegraph/cody-ui/src/Chat';
import { type VSCodeWrapper } from './utils/VSCodeApi';
interface ChatboxProps {
    welcomeMessage?: string;
    chatEnabled: boolean;
    messageInProgress: ChatMessage | null;
    messageBeingEdited: number | undefined;
    setMessageBeingEdited: (index?: number) => void;
    transcript: ChatMessage[];
    formInput: string;
    setFormInput: (input: string) => void;
    inputHistory: ChatInputHistory[];
    setInputHistory: (history: ChatInputHistory[]) => void;
    vscodeAPI: VSCodeWrapper;
    telemetryService: TelemetryService;
    isTranscriptError: boolean;
    contextSelection?: ContextFile[] | null;
    setContextSelection: (context: ContextFile[] | null) => void;
    setChatModels?: (models: ModelProvider[]) => void;
    chatModels?: ModelProvider[];
    userInfo: UserAccountInfo;
    guardrails?: Guardrails;
    chatIDHistory: string[];
    isWebviewActive: boolean;
}
export declare const Chat: React.FunctionComponent<React.PropsWithChildren<ChatboxProps>>;
export {};
//# sourceMappingURL=Chat.d.ts.map