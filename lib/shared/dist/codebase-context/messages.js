import { displayPath } from '../editor/displayPath';
export function getContextMessageWithResponse(text, file, response = 'Ok.', source = 'editor') {
    file.source = file.source || source;
    return [
        { speaker: 'human', text, file },
        { speaker: 'assistant', text: response },
    ];
}
export function createContextMessageByFile(file, content) {
    const code = content || file.content;
    if (!code) {
        return [];
    }
    const filepath = displayPath(file.uri);
    return [
        {
            speaker: 'human',
            text: file.type === 'file'
                ? `Context from file path @${filepath}:\n${code}`
                : `$${file.symbolName} is a ${file.kind} symbol from file path @${filepath}:\n${code}`,
            file,
        },
        { speaker: 'assistant', text: 'OK.' },
    ];
}
//# sourceMappingURL=messages.js.map