"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pythonQueries = void 0;
const dedent_1 = __importDefault(require("dedent"));
const grammars_1 = require("../grammars");
exports.pythonQueries = {
    [grammars_1.SupportedLanguage.Python]: {
        singlelineTriggers: '',
        intents: (0, dedent_1.default) `
            ; Cursor dependent intents
            ;--------------------------------

            (function_definition
                name: (_) @function.name!
                parameters: (_ ("(") @function.parameters.cursor) @function.parameters (":") @function.body.cursor
                body: (block) @function.body)

            (lambda
                parameters: (_) @function.parameters (":") @function.body.cursor
                body: (_) @function.body)

            (class_definition
                name: (_) @class.name (":") @class.body.cursor
                body: (_) @class.body)

            (argument_list ("(") @arguments.cursor) @arguments


            ; Atomic intents
            ;--------------------------------

            (import_from_statement
                module_name: (_) @import.source!
                name: (_) @import.name!)

            (comment) @comment!
            (argument_list (_) @argument!)

            (parameters) @parameters!
            (lambda_parameters) @parameters!
            (parameters (_) @parameter!)
            (lambda_parameters (_)) @parameter!

            (return_statement) @return_statement!
            (return_statement (_) @return_statement.value!)
        `,
        documentableNodes: '',
    },
};
