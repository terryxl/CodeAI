"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.goQueries = void 0;
const dedent_1 = __importDefault(require("dedent"));
const grammars_1 = require("../grammars");
exports.goQueries = {
    [grammars_1.SupportedLanguage.Go]: {
        singlelineTriggers: (0, dedent_1.default) `
            (struct_type (field_declaration_list ("{") @block_start)) @trigger
            (interface_type ("{") @block_start) @trigger
        `,
        intents: '',
        documentableNodes: '',
    },
};
