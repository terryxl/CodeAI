"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.symfExpandQuery = void 0;
const fast_xml_parser_1 = require("fast-xml-parser");
async function symfExpandQuery(completionsClient, query) {
    const stream = completionsClient.stream({
        messages: [
            {
                speaker: 'human',
                text: `You are helping the user search over a codebase. List some filename fragments that would match files relevant to read to answer the user's query. Present your results in an XML list in the following format: <keywords><keyword><value>a single keyword</value><variants>a space separated list of synonyms and variants of the keyword, including acronyms, abbreviations, and expansions</variants><weight>a numerical weight between 0.0 and 1.0 that indicates the importance of the keyword</weight></keyword></keywords>. Here is the user query: <userQuery>${query}</userQuery>`,
            },
            { speaker: 'assistant' },
        ],
        maxTokensToSample: 400,
        temperature: 0,
        topK: 1,
        fast: true,
    });
    const streamingText = [];
    for await (const message of stream) {
        switch (message.type) {
            case 'change': {
                streamingText.push(message.text);
                break;
            }
            case 'error': {
                throw message.error;
            }
        }
    }
    const text = streamingText.at(-1) ?? '';
    const parser = new fast_xml_parser_1.XMLParser();
    const document = parser.parse(text);
    const keywords = 
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    document?.keywords?.keyword ?? [];
    const result = new Set();
    for (const { value, variants } of keywords) {
        if (typeof value === 'string' && value) {
            result.add(value);
        }
        if (typeof variants === 'string') {
            for (const variant of variants.split(' ')) {
                if (variant) {
                    result.add(variant);
                }
            }
        }
    }
    return [...result].sort().join(' ');
}
exports.symfExpandQuery = symfExpandQuery;
