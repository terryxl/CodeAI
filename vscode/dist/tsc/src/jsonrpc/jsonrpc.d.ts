/// <reference path="../../../../src/fileUri.d.ts" />
/// <reference types="node" />
/// <reference types="node" />
/// <reference types="node" />
import type { ChildProcessWithoutNullStreams } from 'node:child_process';
import { Readable, Writable } from 'node:stream';
import * as vscode from 'vscode';
import type * as agent from './agent-protocol';
import type * as bfg from './bfg-protocol';
import type * as embeddings from './embeddings-protocol';
type Requests = bfg.Requests & agent.Requests & embeddings.Requests;
type Notifications = bfg.Notifications & agent.Notifications & embeddings.Notifications;
export type RequestMethodName = keyof Requests;
export type NotificationMethodName = keyof Notifications;
type MethodName = RequestMethodName | NotificationMethodName;
type ParamsOf<K extends MethodName> = (Requests & Notifications)[K][0];
type ResultOf<K extends RequestMethodName> = Requests[K][1];
type Id = string | number;
declare enum ErrorCode {
    ParseError = -32700,
    InvalidRequest = -32600,
    MethodNotFound = -32601,
    InvalidParams = -32602,
    InternalError = -32603,
    RequestCanceled = -32604,
    RateLimitError = -32000
}
interface ErrorInfo<T> {
    code: ErrorCode;
    message: string;
    data: T;
}
interface RequestMessage<M extends RequestMethodName> {
    jsonrpc: '2.0';
    id: Id;
    method: M;
    params?: ParamsOf<M>;
}
interface ResponseMessage<M extends RequestMethodName> {
    jsonrpc: '2.0';
    id: Id;
    result?: ResultOf<M>;
    error?: ErrorInfo<any>;
}
interface NotificationMessage<M extends NotificationMethodName> {
    jsonrpc: '2.0';
    method: M;
    params?: ParamsOf<M>;
}
type Message = RequestMessage<any> & ResponseMessage<any> & NotificationMessage<any>;
type MessageHandlerCallback = (err: Error | null, msg: Message | null) => void;
declare class MessageDecoder extends Writable {
    callback: MessageHandlerCallback;
    private buffer;
    private contentLengthRemaining;
    private contentBuffer;
    constructor(callback: MessageHandlerCallback);
    _write(chunk: Buffer, encoding: string, callback: (error?: Error | null) => void): void;
}
declare class MessageEncoder extends Readable {
    private buffer;
    send(data: any): void;
    _read(size: number): void;
}
export type RequestCallback<M extends RequestMethodName> = (params: ParamsOf<M>, cancelToken: vscode.CancellationToken) => Promise<ResultOf<M>>;
type NotificationCallback<M extends NotificationMethodName> = (params: ParamsOf<M>) => void | Promise<void>;
/**
 * Only exported API in this file. MessageHandler exposes a public `messageDecoder` property
 * that can be piped with ReadStream/WriteStream.
 */
export declare class MessageHandler {
    id: number;
    requestHandlers: Map<RequestMethodName, RequestCallback<any>>;
    private cancelTokens;
    private notificationHandlers;
    private alive;
    private processExitedError;
    private responseHandlers;
    isAlive(): boolean;
    exit(): void;
    connectProcess(child: ChildProcessWithoutNullStreams, reject?: (error: Error) => void): void;
    messageDecoder: MessageDecoder;
    messageEncoder: MessageEncoder;
    registerRequest<M extends RequestMethodName>(method: M, callback: RequestCallback<M>): void;
    registerNotification<M extends NotificationMethodName>(method: M, callback: NotificationCallback<M>): void;
    request<M extends RequestMethodName>(method: M, params: ParamsOf<M>): Promise<ResultOf<M>>;
    notify<M extends NotificationMethodName>(method: M, params: ParamsOf<M>): void;
    /**
     * @returns A JSON-RPC client to interact directly with this agent instance. Useful when we want
     * to use the agent in-process without stdout/stdin transport mechanism.
     */
    clientForThisInstance(): InProcessClient;
}
/**
 * A client for a JSON-RPC {@link MessageHandler} running in the same process.
 */
declare class InProcessClient {
    private readonly requestHandlers;
    private readonly notificationHandlers;
    constructor(requestHandlers: Map<RequestMethodName, RequestCallback<any>>, notificationHandlers: Map<NotificationMethodName, NotificationCallback<any>>);
    request<M extends RequestMethodName>(method: M, params: ParamsOf<M>, cancelToken?: vscode.CancellationToken): Promise<ResultOf<M>>;
    notify<M extends NotificationMethodName>(method: M, params: ParamsOf<M>): void;
}
export {};
//# sourceMappingURL=jsonrpc.d.ts.map