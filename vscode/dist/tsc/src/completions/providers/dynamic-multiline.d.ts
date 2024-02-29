import { type DocumentContext } from '../get-current-doc-context';
interface GetUpdatedDocumentContextParams {
    insertText: string;
    languageId: string;
    docContext: DocumentContext;
}
/**
 * 1. Generates the object with `multilineTrigger` and `multilineTriggerPosition` fields pretending like the first line of the completion is already in the document.
 * 2. If the updated document context has the multiline trigger, returns the generated object
 * 3. Otherwise, returns an empty object.
 */
export declare function getDynamicMultilineDocContext(params: GetUpdatedDocumentContextParams): Pick<DocumentContext, 'multilineTrigger' | 'multilineTriggerPosition'> | undefined;
export {};
//# sourceMappingURL=dynamic-multiline.d.ts.map