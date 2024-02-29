"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CodyNodeHttpAdapter = void 0;
const adapter_node_http_1 = __importDefault(require("@pollyjs/adapter-node-http"));
class CodyNodeHttpAdapter extends adapter_node_http_1.default {
    async onRequest(request) {
        if (request.body) {
            request.body = request.body
                .replaceAll(/`([^`]*)(cody-vscode-shim-test[^`]*)`/g, '`$2`')
                .replaceAll(/(\\\\)(\w)/g, '/$2');
        }
        return super.onRequest(request);
    }
}
exports.CodyNodeHttpAdapter = CodyNodeHttpAdapter;
