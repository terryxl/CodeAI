"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PollyYamlWriter = void 0;
const path_1 = __importDefault(require("path"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const yaml_1 = __importDefault(require("yaml"));
// Implements the exact same API as `API` from '@polly/core' but uses YAML
// instead of JSON. We can't make the functions return Promise because that would
// break compatibility with the original API implementation.
class PollyYamlWriter {
    recordingsDir;
    constructor(recordingsDir) {
        this.recordingsDir = recordingsDir;
    }
    getRecording(recording) {
        const recordingFilename = this.filenameFor(recording);
        if (fs_extra_1.default.existsSync(recordingFilename)) {
            const text = fs_extra_1.default.readFileSync(recordingFilename).toString();
            const data = yaml_1.default.parse(text);
            return this.respond(200, data);
        }
        return this.respond(204);
    }
    saveRecording(recording, data) {
        const text = yaml_1.default.stringify(data, undefined, { singleQuote: false });
        fs_extra_1.default.outputFileSync(this.filenameFor(recording), text);
        return this.respond(201);
    }
    deleteRecording(recording) {
        const recordingFilename = this.filenameFor(recording);
        if (fs_extra_1.default.existsSync(recordingFilename)) {
            fs_extra_1.default.removeSync(recordingFilename);
        }
        return this.respond(200);
    }
    filenameFor(recording) {
        return path_1.default.join(this.recordingsDir, recording, 'recording.har.yaml');
    }
    respond(status, body) {
        return { status, body };
    }
}
exports.PollyYamlWriter = PollyYamlWriter;
