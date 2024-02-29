export function getProviderName(name) {
    const providerName = name.toLowerCase();
    switch (providerName) {
        case 'anthropic':
            return 'Anthropic';
        case 'openai':
            return 'OpenAI';
        default:
            return providerName;
    }
}
//# sourceMappingURL=utils.js.map