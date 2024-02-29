import type { SupportedLanguage } from './grammars';
export type QueryName = 'singlelineTriggers' | 'intents' | 'documentableNodes';
/**
 * Completion intents sorted by priority.
 * Top-most items are used if capture group ranges are identical.
 */
export declare const intentPriority: readonly ["function.name", "function.parameters", "function.body", "type_declaration.name", "type_declaration.body", "arguments", "import.source", "comment", "pair.value", "argument", "parameter", "parameters", "jsx_attribute.value", "return_statement.value", "return_statement", "string"];
/**
 * Completion intent label derived from the AST nodes before the cursor.
 */
export type CompletionIntent = (typeof intentPriority)[number];
export declare const languages: Partial<Record<SupportedLanguage, Record<QueryName, string>>>;
//# sourceMappingURL=queries.d.ts.map