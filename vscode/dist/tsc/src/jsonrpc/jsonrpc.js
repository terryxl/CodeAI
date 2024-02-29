"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageHandler = void 0;
const node_assert_1 = __importDefault(require("node:assert"));
const node_fs_1 = require("node:fs");
const node_path_1 = require("node:path");
const node_stream_1 = require("node:stream");
const vscode = __importStar(require("vscode"));
const cody_shared_1 = require("@sourcegraph/cody-shared");
// Error codes as defined by the JSON-RPC spec.
var ErrorCode;
(function (ErrorCode) {
    ErrorCode[ErrorCode["ParseError"] = -32700] = "ParseError";
    ErrorCode[ErrorCode["InvalidRequest"] = -32600] = "InvalidRequest";
    ErrorCode[ErrorCode["MethodNotFound"] = -32601] = "MethodNotFound";
    ErrorCode[ErrorCode["InvalidParams"] = -32602] = "InvalidParams";
    ErrorCode[ErrorCode["InternalError"] = -32603] = "InternalError";
    ErrorCode[ErrorCode["RequestCanceled"] = -32604] = "RequestCanceled";
    ErrorCode[ErrorCode["RateLimitError"] = -32000] = "RateLimitError";
})(ErrorCode || (ErrorCode = {}));
class JsonrpcError extends Error {
    info;
    constructor(info) {
        super();
        this.info = info;
    }
    toString() {
        return `${this.name}: ${this.message}`;
    }
    get name() {
        return ErrorCode[this.info.code];
    }
    get message() {
        if (typeof this.info?.data === 'string') {
            try {
                const data = JSON.parse(this.info.data);
                return `${this.info.message}: ${JSON.stringify(data, null, 2)}`;
            }
            catch {
                // ignore
            }
            return `${this.info.message}: ${this.info.data}`;
        }
        return this.info.message;
    }
}
/**
 * Absolute path to a file where the agent can write low-level debugging logs to
 * trace all incoming/outgoing JSON messages.
 */
const tracePath = process.env.CODY_AGENT_TRACE_PATH ?? '';
class MessageDecoder extends node_stream_1.Writable {
    callback;
    buffer = Buffer.alloc(0);
    contentLengthRemaining = null;
    contentBuffer = Buffer.alloc(0);
    constructor(callback) {
        super();
        this.callback = callback;
        if (tracePath) {
            if ((0, node_fs_1.existsSync)(tracePath)) {
                (0, node_fs_1.rmSync)(tracePath);
            }
            (0, node_fs_1.mkdirSync)((0, node_path_1.dirname)(tracePath), { recursive: true });
        }
    }
    _write(chunk, encoding, callback) {
        this.buffer = Buffer.concat([this.buffer, chunk]);
        // We loop through as we could have a double message that requires processing twice
        read: while (true) {
            if (this.contentLengthRemaining === null) {
                const headerString = this.buffer.toString();
                let startIndex = 0;
                let endIndex;
                // We create this as we might get partial messages
                // so we only want to set the content length
                // once we get the whole thing
                let newContentLength = 0;
                const LINE_TERMINATOR = '\r\n';
                // biome-ignore lint/suspicious/noAssignInExpressions: useful
                while ((endIndex = headerString.indexOf(LINE_TERMINATOR, startIndex)) !== -1) {
                    const entry = headerString.slice(startIndex, endIndex);
                    const [headerName, headerValue] = entry.split(':').map(_ => _.trim());
                    if (headerValue === undefined) {
                        this.buffer = this.buffer.slice(endIndex + LINE_TERMINATOR.length);
                        // Asserts we actually have a valid header with a Content-Length
                        // This state is irrecoverable because the stream is polluted
                        // Also what is the client doing 😭
                        this.contentLengthRemaining = newContentLength;
                        (0, node_assert_1.default)(Number.isFinite(this.contentLengthRemaining), `parsed Content-Length ${this.contentLengthRemaining} is not a finite number`);
                        continue read;
                    }
                    switch (headerName) {
                        case 'Content-Length':
                            newContentLength = parseInt(headerValue, 10);
                            break;
                        default:
                            console.error(`Unknown header '${headerName}': ignoring!`);
                            break;
                    }
                    startIndex = endIndex + LINE_TERMINATOR.length;
                }
                break;
            }
            if (this.contentLengthRemaining === 0) {
                try {
                    const data = JSON.parse(this.contentBuffer.toString());
                    this.contentBuffer = Buffer.alloc(0);
                    this.contentLengthRemaining = null;
                    if (tracePath) {
                        (0, node_fs_1.appendFileSync)(tracePath, `<- ${JSON.stringify(data, null, 4)}\n`);
                    }
                    this.callback(null, data);
                }
                catch (error) {
                    if (tracePath) {
                        (0, node_fs_1.appendFileSync)(tracePath, `<- ${JSON.stringify({ error }, null, 4)}\n`);
                    }
                    process.stderr.write(`jsonrpc.ts: JSON parse error against input '${this.contentBuffer}', contentLengthRemaining=${this.contentLengthRemaining}. Error:\n${error}\n`);
                    // Kill the process to surface the error as early as
                    // possible. Before, we did `this.callback(error, null)`
                    // and it regularly got the agent into an infinite loop
                    // that was difficult to debug.
                    process.exit(1);
                }
                continue;
            }
            const data = this.buffer.slice(0, this.contentLengthRemaining);
            // If there isn't anymore data, break out of the loop to wait
            // for more chunks to be written to the stream.
            if (data.length === 0) {
                break;
            }
            this.contentBuffer = Buffer.concat([this.contentBuffer, data]);
            this.buffer = this.buffer.slice(this.contentLengthRemaining);
            this.contentLengthRemaining -= data.byteLength;
        }
        callback();
    }
}
class MessageEncoder extends node_stream_1.Readable {
    buffer = Buffer.alloc(0);
    send(data) {
        if (tracePath) {
            (0, node_fs_1.appendFileSync)(tracePath, `-> ${JSON.stringify(data, null, 4)}\n`);
        }
        this.pause();
        const content = Buffer.from(JSON.stringify(data), 'utf-8');
        const header = Buffer.from(`Content-Length: ${content.byteLength}\r\n\r\n`, 'utf-8');
        this.buffer = Buffer.concat([this.buffer, header, content]);
        this.resume();
    }
    _read(size) {
        this.push(this.buffer.slice(0, size));
        this.buffer = this.buffer.slice(size);
    }
}
/**
 * Only exported API in this file. MessageHandler exposes a public `messageDecoder` property
 * that can be piped with ReadStream/WriteStream.
 */
class MessageHandler {
    id = 0;
    requestHandlers = new Map();
    cancelTokens = new Map();
    notificationHandlers = new Map();
    alive = true;
    processExitedError = () => new Error('Process has exited');
    responseHandlers = new Map();
    isAlive() {
        return this.alive;
    }
    exit() {
        this.alive = false;
        const error = this.processExitedError();
        for (const { reject } of this.responseHandlers.values()) {
            reject(error);
        }
    }
    connectProcess(child, reject) {
        child.on('disconnect', () => {
            reject?.(new Error('disconnect'));
            this.exit();
        });
        child.on('close', () => {
            if (this.isAlive()) {
                reject?.(new Error('close'));
            }
            this.exit();
        });
        child.on('error', error => {
            reject?.(error);
            this.exit();
        });
        child.on('exit', code => {
            if (code !== 0) {
                reject?.(new Error(`exit: ${code}`));
            }
            this.exit();
        });
        child.stderr.on('data', data => {
            console.error(`----stderr----\n${data}--------------`);
        });
        child.stdout.pipe(this.messageDecoder);
        this.messageEncoder.pipe(child.stdin);
    }
    // TODO: RPC error handling
    messageDecoder = new MessageDecoder((err, msg) => {
        if (err) {
            console.error(`Error: ${err}`);
        }
        if (!msg) {
            return;
        }
        if (msg.id !== undefined && msg.method) {
            if (typeof msg.id === 'number' && msg.id > this.id) {
                this.id = msg.id + 1;
            }
            // Requests have ids and methods
            const handler = this.requestHandlers.get(msg.method);
            if (handler) {
                const cancelToken = new vscode.CancellationTokenSource();
                this.cancelTokens.set(msg.id, cancelToken);
                handler(msg.params, cancelToken.token)
                    .then(result => {
                    const data = {
                        jsonrpc: '2.0',
                        id: msg.id,
                        result,
                    };
                    this.messageEncoder.send(data);
                }, error => {
                    const message = error instanceof Error ? error.message : `${error}`;
                    const stack = error instanceof Error ? `\n${error.stack}` : '';
                    const code = cancelToken.token.isCancellationRequested
                        ? ErrorCode.RequestCanceled
                        : (0, cody_shared_1.isRateLimitError)(error)
                            ? ErrorCode.RateLimitError
                            : ErrorCode.InternalError;
                    const data = {
                        jsonrpc: '2.0',
                        id: msg.id,
                        error: {
                            code,
                            // Include the stack in the message because
                            // some JSON-RPC bindings like lsp4j don't
                            // expose access to the `data` property,
                            // only `message`. The stack is super
                            // helpful to track down unexpected
                            // exceptions.
                            message: `${message}\n${stack}`,
                            data: JSON.stringify({ error, stack }),
                        },
                    };
                    this.messageEncoder.send(data);
                })
                    .finally(() => {
                    this.cancelTokens.get(msg.id)?.dispose();
                    this.cancelTokens.delete(msg.id);
                });
            }
            else {
                console.error(`No handler for request with method ${msg.method}`);
            }
        }
        else if (msg.id !== undefined) {
            // Responses have ids
            const handler = this.responseHandlers.get(msg.id);
            if (handler) {
                if (msg?.error) {
                    handler.reject(new JsonrpcError(msg.error));
                }
                else {
                    handler.resolve(msg.result);
                }
                this.responseHandlers.delete(msg.id);
            }
            else {
                console.error(`No handler for response with id ${msg.id}`);
            }
        }
        else if (msg.method) {
            // Notifications have methods
            if (msg.method === '$/cancelRequest' &&
                msg.params &&
                (typeof msg.params.id === 'string' || typeof msg.params.id === 'number')) {
                this.cancelTokens.get(msg.params.id)?.cancel();
                this.cancelTokens.delete(msg.params.id);
            }
            else {
                const notificationHandler = this.notificationHandlers.get(msg.method);
                if (notificationHandler) {
                    try {
                        void notificationHandler(msg.params);
                    }
                    catch (error) {
                        (0, cody_shared_1.logError)('JSON-RPC', `Uncaught error in notification handler for method '${msg.method}'`, error + (error instanceof Error ? '\n\n' + error.stack : ''));
                    }
                }
                else {
                    console.error(`No handler for notification with method ${msg.method}`);
                }
            }
        }
    });
    messageEncoder = new MessageEncoder();
    registerRequest(method, callback) {
        this.requestHandlers.set(method, callback);
    }
    registerNotification(method, callback) {
        this.notificationHandlers.set(method, callback);
    }
    request(method, params) {
        if (!this.isAlive()) {
            throw this.processExitedError();
        }
        const id = this.id++;
        const data = {
            jsonrpc: '2.0',
            id,
            method,
            params,
        };
        this.messageEncoder.send(data);
        return new Promise((resolve, reject) => {
            this.responseHandlers.set(id, { resolve, reject });
        });
    }
    notify(method, params) {
        if (!this.isAlive()) {
            throw this.processExitedError();
        }
        const data = {
            jsonrpc: '2.0',
            method,
            params,
        };
        this.messageEncoder.send(data);
    }
    /**
     * @returns A JSON-RPC client to interact directly with this agent instance. Useful when we want
     * to use the agent in-process without stdout/stdin transport mechanism.
     */
    clientForThisInstance() {
        if (!this.isAlive()) {
            throw this.processExitedError();
        }
        return new InProcessClient(this.requestHandlers, this.notificationHandlers);
    }
}
exports.MessageHandler = MessageHandler;
/**
 * A client for a JSON-RPC {@link MessageHandler} running in the same process.
 */
class InProcessClient {
    requestHandlers;
    notificationHandlers;
    constructor(requestHandlers, notificationHandlers) {
        this.requestHandlers = requestHandlers;
        this.notificationHandlers = notificationHandlers;
    }
    request(method, params, cancelToken = new vscode.CancellationTokenSource().token) {
        const handler = this.requestHandlers.get(method);
        if (handler) {
            return handler(params, cancelToken);
        }
        throw new Error(`No such request handler: ${method}`);
    }
    notify(method, params) {
        const handler = this.notificationHandlers.get(method);
        if (handler) {
            void handler(params);
            return;
        }
        throw new Error(`No such notification handler: ${method}`);
    }
}
