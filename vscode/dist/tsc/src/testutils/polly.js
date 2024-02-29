"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startPollyRecording = void 0;
const child_process_1 = require("child_process");
const path_1 = __importDefault(require("path"));
const core_1 = require("@pollyjs/core");
const CodyNodeHttpAdapter_1 = require("./CodyNodeHttpAdapter");
const CodyPersister_1 = require("./CodyPersister");
function startPollyRecording(userOptions) {
    const options = defaultPollyOptions(userOptions);
    core_1.Polly.register(CodyNodeHttpAdapter_1.CodyNodeHttpAdapter);
    core_1.Polly.register(CodyPersister_1.CodyPersister);
    return new core_1.Polly(options.recordingName ?? 'CodyAgent', {
        flushRequestsOnStop: true,
        recordIfMissing: options.recordIfMissing ?? options.recordingMode === 'record',
        mode: options.recordingMode,
        adapters: ['node-http'],
        persister: 'cody-fs',
        recordFailedRequests: true,
        expiryStrategy: options.recordingExpiryStrategy,
        expiresIn: options.expiresIn,
        persisterOptions: {
            keepUnusedRequests: options.keepUnusedRecordings ?? true,
            fs: {
                recordingsDir: options.recordingDirectory,
            },
        },
        matchRequestsBy: {
            order: false,
            // The logic below is a bit tricky to follow. Simplified, we need to
            // ensure that Polly generates the same request ID regardless if
            // we're running in record mode (with an access token) or in replay
            // mode (with a redacted token). The ID is computed by Polly as the
            // MD5 digest of all request "identifiers", which a JSON object that
            // includes a "headers" property from the result of the function
            // below. To better understand what's going on, it's helpful to read
            // the implementation of Polly here:
            //   https://sourcegraph.com/github.com/Netflix/pollyjs@9b6bede12b7ee998472b8883c9dd01e2159e00a8/-/blob/packages/@pollyjs/core/src/-private/request.js?L281
            headers(headers) {
                // Step 1: get the authorization token as a plain string
                let token = '';
                const { authorization } = headers;
                if (authorization !== undefined &&
                    typeof authorization[Symbol.iterator] === 'function') {
                    token = [...authorization].at(0) ?? '';
                }
                else if (typeof authorization === 'string') {
                    // token = authorization
                }
                // Step 2: if the token is unredacted, redact it so that the ID
                // is the same regardless if we're in record or replay mode.
                if (!token.startsWith('token REDACTED')) {
                    return { authorization: [(0, CodyPersister_1.redactAccessToken)(token)] };
                }
                // We are most likely running in replay mode and don't need to
                // customize how the token is digested.
                return { authorization };
            },
        },
    });
}
exports.startPollyRecording = startPollyRecording;
function defaultPollyOptions(options) {
    let recordingMode = 'replay';
    switch (process.env.CODY_RECORDING_MODE) {
        case 'record':
        case 'replay':
        case 'passthrough':
        case 'stopped':
            recordingMode = process.env.CODY_RECORDING_MODE;
            break;
        default:
            if (typeof process.env.CODY_RECORDING_MODE === 'string') {
                throw new TypeError(`Not a valid recording mode '${process.env.CODY_RECORDING_MODE}'. Valid options are record, replay, passthrough, or stopped.`);
            }
    }
    const recordingDirectory = () => {
        const rootDirectory = (0, child_process_1.execSync)('git rev-parse --show-toplevel', {
            encoding: 'utf-8',
        }).trim();
        return path_1.default.join(rootDirectory, 'recordings');
    };
    return {
        recordIfMissing: process.env.CODY_RECORD_IF_MISSING === 'true' || recordingMode === 'record',
        recordingMode,
        recordingDirectory: options.recordingDirectory ?? recordingDirectory(),
        expiresIn: '365d',
        recordingExpiryStrategy: 'error',
        ...options,
    };
}
