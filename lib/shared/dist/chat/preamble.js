export function getSimplePreamble(preInstruction) {
    return [
        {
            speaker: 'human',
            text: `You are Cody, an AI coding assistant from Sourcegraph.${preInstruction ? ` ${preInstruction}` : ''}`,
        },
        {
            speaker: 'assistant',
            text: 'I am Cody, an AI coding assistant from Sourcegraph.',
        },
    ];
}
//# sourceMappingURL=preamble.js.map