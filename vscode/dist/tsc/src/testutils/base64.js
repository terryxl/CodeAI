"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.decodeCompressedBase64 = void 0;
const pako_1 = __importDefault(require("pako"));
function decodeCompressedBase64(text) {
    const bytes = Buffer.from(text, 'base64');
    const unzipped = pako_1.default.ungzip(bytes);
    return JSON.parse(Buffer.from(unzipped).toString('utf-8'));
}
exports.decodeCompressedBase64 = decodeCompressedBase64;
