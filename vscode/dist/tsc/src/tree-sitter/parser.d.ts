import type Parser from 'web-tree-sitter';
import { SupportedLanguage } from './grammars';
interface ParserSettings {
    language: SupportedLanguage;
    grammarDirectory?: string;
}
export declare function getParser(language: SupportedLanguage): Parser | undefined;
export declare function resetParsersCache(): void;
export declare function createParser(settings: ParserSettings): Promise<Parser | undefined>;
export {};
//# sourceMappingURL=parser.d.ts.map