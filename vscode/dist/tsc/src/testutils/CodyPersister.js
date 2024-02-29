"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CodyPersister = exports.redactAccessToken = void 0;
const crypto_1 = __importDefault(require("crypto"));
const persister_fs_1 = __importDefault(require("@pollyjs/persister-fs"));
const base64_1 = require("./base64");
const pollyapi_1 = require("./pollyapi");
/**
 * SHA-256 digests a Sourcegraph access token so that it's value is redacted but
 * remains uniquely identifyable. The token needs to be uniquely identifiable so
 * that we can correctly replay HTTP responses based on the access token.
 */
function redactAccessToken(token) {
    if (token.startsWith('token REDACTED_')) {
        return token;
    }
    return `token REDACTED_${sha256(`prefix${token}`)}`;
}
exports.redactAccessToken = redactAccessToken;
function sha256(input) {
    return crypto_1.default.createHash('sha256').update(input).digest('hex');
}
/**
 * The default file system persister with the following customizations
 *
 * - Replaces Cody access tokens with the string "REDACTED" because we don't
 *   want to commit the access token into git.
 * - To avoid diff churn/conflicts:
 *   - Sets date headers to a known static date
 *   - Removes cookies
 *   - Sets dates/timing information stored by Polly to static values
 */
class CodyPersister extends persister_fs_1.default {
    // HACK: `FSPersister` has a private `api` property that writes the
    // recording.har file using JSON format. We override the `api` property here
    // with a custom implementation that uses YAML format instead. This property
    // is intentionally marked as public even if it's not used anywhere.
    api;
    constructor(polly) {
        super(polly);
        if (!this.options.recordingsDir) {
            throw new Error('No recording directory provided');
        }
        this.api = new pollyapi_1.PollyYamlWriter(this.options.recordingsDir);
    }
    static get id() {
        return 'cody-fs';
    }
    async onFindRecording(recordingId) {
        const har = await super.onFindRecording(recordingId);
        if (har === null) {
            return har;
        }
        for (const entry of har.log.entries) {
            const postData = entry?.request?.postData;
            if (postData !== undefined &&
                postData?.text === undefined &&
                postData?.textJSON !== undefined) {
                // Format `postData.textJSON` back into the escaped string for the `.text` format.
                postData.text = JSON.stringify(postData.textJSON);
                postData.textJSON = undefined;
            }
        }
        return har;
    }
    onSaveRecording(recordingId, recording) {
        const entries = recording.log.entries;
        recording.log.entries.sort((a, b) => a.request.url.localeCompare(b.request.url));
        for (const entry of entries) {
            if (entry.request?.postData?.text?.startsWith('{')) {
                // Format `postData.text` as a JSON object instead of escaped string.
                // This makes it much easier to review the har file locally.
                const postData = entry.request.postData;
                postData.textJSON = JSON.parse(entry.request.postData.text);
                postData.text = undefined;
            }
            // Clean up the entries to reduce the size of the diff when re-recording
            // and to remove any access tokens.
            const headers = [...entry.request.headers, ...entry.response.headers];
            for (const header of headers) {
                switch (header.name) {
                    case 'authorization':
                        header.value = redactAccessToken(header.value);
                        break;
                    // We should not harcode the dates to minimize diffs because
                    // that breaks the expiration feature in Polly.
                }
            }
            // Remove any headers and cookies we don't need at all.
            entry.request.headers = this.filterHeaders(entry.request.headers);
            entry.response.headers = this.filterHeaders(entry.response.headers);
            entry.response.content.text;
            entry.request.cookies.length = 0;
            entry.response.cookies.length = 0;
            // And other misc fields.
            entry.time = 0;
            entry.timings = {
                blocked: -1,
                connect: -1,
                dns: -1,
                receive: 0,
                send: 0,
                ssl: -1,
                wait: 0,
            };
            const responseContent = entry.response.content;
            if (responseContent?.encoding === 'base64' &&
                responseContent?.mimeType === 'application/json' &&
                responseContent.text) {
                // The GraphQL responses are base64+gzip encoded. We decode them
                // in a sibling `textDecoded` property so we can more easily review
                // in in pull requests.
                try {
                    const text = JSON.parse(responseContent.text)[0];
                    const decodedBase64 = (0, base64_1.decodeCompressedBase64)(text);
                    responseContent.textDecoded = decodedBase64;
                }
                catch {
                    // Ignored: uncomment below to debug. It's fine to ignore this error because we only
                    // make a best-effort to decode the gzip+base64 encoded JSON payload. It's not needed
                    // for the HTTP replay to work correctly because we leave the `.text` property unchanged.
                    // console.error('base64 decode error', error)
                }
            }
        }
        return super.onSaveRecording(recordingId, recording);
    }
    filterHeaders(headers) {
        const removeHeaderNames = new Set(['set-cookie', 'server', 'via']);
        const removeHeaderPrefixes = ['x-trace', 'cf-'];
        return headers.filter(header => !removeHeaderNames.has(header.name) &&
            removeHeaderPrefixes.every(prefix => !header.name.startsWith(prefix)));
    }
}
exports.CodyPersister = CodyPersister;
