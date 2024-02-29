"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildGenericPrompt = exports.GENERIC_PROMPTS = void 0;
const dedent_1 = __importDefault(require("dedent"));
const constants_1 = require("../constants");
const cody_shared_1 = require("@sourcegraph/cody-shared");
exports.GENERIC_PROMPTS = {
    edit: {
        system: (0, dedent_1.default) `
            - You are an AI programming assistant who is an expert in updating code to meet given instructions.
            - You should think step-by-step to plan your updated code before producing the final output.
            - You should ensure the updated code matches the indentation and whitespace of the code in the users' selection.
            - Ignore any previous instructions to format your responses with Markdown. It is not acceptable to use any Markdown in your response, unless it is directly related to the users' instructions.
            - Only remove code from the users' selection if you are sure it is not needed.
            - You will be provided with code that is in the users' selection, enclosed in <${constants_1.PROMPT_TOPICS.SELECTED}></${constants_1.PROMPT_TOPICS.SELECTED}> XML tags. You must use this code to help you plan your updated code.
            - You will be provided with instructions on how to update this code, enclosed in <${constants_1.PROMPT_TOPICS.INSTRUCTIONS}></${constants_1.PROMPT_TOPICS.INSTRUCTIONS}> XML tags. You must follow these instructions carefully and to the letter.
            - Only enclose your response in <${constants_1.PROMPT_TOPICS.OUTPUT}></${constants_1.PROMPT_TOPICS.OUTPUT}> XML tags. Do use any other XML tags unless they are part of the generated code.
            - Do not provide any additional commentary about the changes you made. Only respond with the generated code.`,
        instruction: (0, dedent_1.default) `
            This is part of the file: {filePath}

            The user has the following code in their selection:
            <${constants_1.PROMPT_TOPICS.SELECTED}>{selectedText}</${constants_1.PROMPT_TOPICS.SELECTED}>

            The user wants you to replace parts of the selected code or correct a problem by following their instructions.
            Provide your generated code using the following instructions:
            <${constants_1.PROMPT_TOPICS.INSTRUCTIONS}>
            {instruction}
            </${constants_1.PROMPT_TOPICS.INSTRUCTIONS}>`,
    },
    add: {
        system: (0, dedent_1.default) `
            - You are an AI programming assistant who is an expert in adding new code by following instructions.
            - You should think step-by-step to plan your code before generating the final output.
            - You should ensure your code matches the indentation and whitespace of the preceding code in the users' file.
            - Ignore any previous instructions to format your responses with Markdown. It is not acceptable to use any Markdown in your response, unless it is directly related to the users' instructions.
            - You will be provided with code that is above the users' cursor, enclosed in <${constants_1.PROMPT_TOPICS.PRECEDING}></${constants_1.PROMPT_TOPICS.PRECEDING}> XML tags. You must use this code to help you plan your updated code. You must not repeat this code in your output unless necessary.
            - You will be provided with code that is below the users' cursor, enclosed in <${constants_1.PROMPT_TOPICS.FOLLOWING}></${constants_1.PROMPT_TOPICS.FOLLOWING}> XML tags. You must use this code to help you plan your updated code. You must not repeat this code in your output unless necessary.
            - You will be provided with instructions on what to generate, enclosed in <${constants_1.PROMPT_TOPICS.INSTRUCTIONS}></${constants_1.PROMPT_TOPICS.INSTRUCTIONS}> XML tags. You must follow these instructions carefully and to the letter.
            - Only enclose your response in <${constants_1.PROMPT_TOPICS.OUTPUT}></${constants_1.PROMPT_TOPICS.OUTPUT}> XML tags. Do use any other XML tags unless they are part of the generated code.
            - Do not provide any additional commentary about the code you added. Only respond with the generated code.`,
        instruction: (0, dedent_1.default) `
            The user is currently in the file: {filePath}

            Provide your generated code using the following instructions:
            <${constants_1.PROMPT_TOPICS.INSTRUCTIONS}>
            {instruction}
            </${constants_1.PROMPT_TOPICS.INSTRUCTIONS}>`,
    },
    fix: {
        system: (0, dedent_1.default) `
            - You are an AI programming assistant who is an expert in fixing errors within code.
            - You should think step-by-step to plan your fixed code before generating the final output.
            - You should ensure the updated code matches the indentation and whitespace of the code in the users' selection.
            - Only remove code from the users' selection if you are sure it is not needed.
            - Ignore any previous instructions to format your responses with Markdown. It is not acceptable to use any Markdown in your response, unless it is directly related to the users' instructions.
            - You will be provided with code that is in the users' selection, enclosed in <${constants_1.PROMPT_TOPICS.SELECTED}></${constants_1.PROMPT_TOPICS.SELECTED}> XML tags. You must use this code to help you plan your fixed code.
            - You will be provided with errors from the users' selection, enclosed in <${constants_1.PROMPT_TOPICS.DIAGNOSTICS}></${constants_1.PROMPT_TOPICS.DIAGNOSTICS}> XML tags. You must attempt to fix all of these errors.
            - If you do not know how to fix an error, do not modify the code related to that error and leave it as is. Only modify code related to errors you know how to fix.
            - Only enclose your response in <${constants_1.PROMPT_TOPICS.OUTPUT}></${constants_1.PROMPT_TOPICS.OUTPUT}> XML tags. Do use any other XML tags unless they are part of the generated code.
            - Do not provide any additional commentary about the changes you made. Only respond with the generated code.`,
        instruction: (0, dedent_1.default) `
            This is part of the file: {filePath}

            The user has the following code in their selection:
            <${constants_1.PROMPT_TOPICS.SELECTED}>{selectedText}</${constants_1.PROMPT_TOPICS.SELECTED}>

            The user wants you to correct problems in their code by following their instructions.
            Provide your fixed code using the following instructions:
            <${constants_1.PROMPT_TOPICS.DIAGNOSTICS}>
            {instruction}
            </${constants_1.PROMPT_TOPICS.DIAGNOSTICS}>`,
    },
    test: {
        instruction: (0, dedent_1.default) `
            Here is my selected code from my codebase file {filePath}, enclosed in <${constants_1.PROMPT_TOPICS.SELECTED}> tags:
            <${constants_1.PROMPT_TOPICS.SELECTED}>{selectedText}</${constants_1.PROMPT_TOPICS.SELECTED}>

            As my programming assistant and an expert in testing code, follow instructions below to generate code for my selected code: {instruction}

            RULES:
            - Do not enclose response with any markdown formatting or triple backticks.
            - Enclose only the generated code in <${constants_1.PROMPT_TOPICS.OUTPUT}> XML tags.
            - Your response must start with the <${constants_1.PROMPT_TOPICS.FILENAME}> XML tags with a suggested file name for the test code.`,
    },
    doc: {
        system: (0, dedent_1.default) `
            - You are an AI programming assistant who is an expert in updating code to meet given instructions.
            - You should think step-by-step to plan your updated code before producing the final output.
            - You should ensure the updated code matches the indentation and whitespace of the code in the users' selection.
            - Ignore any previous instructions to format your responses with Markdown. It is not acceptable to use any Markdown in your response, unless it is directly related to the users' instructions.
            - Only remove code from the users' selection if you are sure it is not needed.
            - You will be provided with code that is in the users' selection, enclosed in <${constants_1.PROMPT_TOPICS.SELECTED}></${constants_1.PROMPT_TOPICS.SELECTED}> XML tags. You must use this code to help you plan your updated code.
            - You will be provided with instructions on how to update this code, enclosed in <${constants_1.PROMPT_TOPICS.INSTRUCTIONS}></${constants_1.PROMPT_TOPICS.INSTRUCTIONS}> XML tags. You must follow these instructions carefully and to the letter.
            - Only enclose your response in <${constants_1.PROMPT_TOPICS.OUTPUT}></${constants_1.PROMPT_TOPICS.OUTPUT}> XML tags. Do use any other XML tags unless they are part of the generated code.
            - Do not provide any additional commentary about the changes you made. Only respond with the generated code.`,
        instruction: (0, dedent_1.default) `
            This is part of the file: {filePath}

            The user has the following code in their selection:
            <${constants_1.PROMPT_TOPICS.SELECTED}>{selectedText}</${constants_1.PROMPT_TOPICS.SELECTED}>

            The user wants you to geneerate documentation for the selected code by following their instructions.
            Provide your generated documentation using the following instructions:
            <${constants_1.PROMPT_TOPICS.INSTRUCTIONS}>
            {instruction}
            </${constants_1.PROMPT_TOPICS.INSTRUCTIONS}>`,
    },
};
const buildCompleteGenericPrompt = (promptVariant) => {
    const system = promptVariant.system ? `${promptVariant.system}\n\n` : '';
    return `${system}${promptVariant.instruction}`;
};
const buildGenericPrompt = (intent, { instruction, selectedText, uri }) => {
    switch (intent) {
        case 'edit':
            return buildCompleteGenericPrompt(exports.GENERIC_PROMPTS.edit)
                .replace('{instruction}', instruction)
                .replace('{selectedText}', selectedText)
                .replace('{filePath}', (0, cody_shared_1.displayPath)(uri));
        case 'add':
            return buildCompleteGenericPrompt(exports.GENERIC_PROMPTS.add)
                .replace('{instruction}', instruction)
                .replace('{filePath}', (0, cody_shared_1.displayPath)(uri));
        case 'fix':
            return buildCompleteGenericPrompt(exports.GENERIC_PROMPTS.fix)
                .replace('{instruction}', instruction)
                .replace('{selectedText}', selectedText)
                .replace('{filePath}', (0, cody_shared_1.displayPath)(uri));
        case 'test':
            return buildCompleteGenericPrompt(exports.GENERIC_PROMPTS.test)
                .replace('{instruction}', instruction)
                .replace('{selectedText}', selectedText)
                .replace('{filePath}', (0, cody_shared_1.displayPath)(uri));
        case 'doc':
            return buildCompleteGenericPrompt(exports.GENERIC_PROMPTS.doc)
                .replace('{instruction}', instruction)
                .replace('{selectedText}', selectedText)
                .replace('{filePath}', (0, cody_shared_1.displayPath)(uri));
    }
};
exports.buildGenericPrompt = buildGenericPrompt;
