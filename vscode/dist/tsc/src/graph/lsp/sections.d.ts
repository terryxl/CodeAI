/// <reference path="../../../../../src/fileUri.d.ts" />
import * as vscode from 'vscode';
export interface DocumentSection {
    fuzzyName: string | null;
    location: vscode.Location;
}
/**
 * Creates a top level map of a document's sections based on symbol ranges
 *
 * TODO(philipp-spiess): We need advanced heuristics here so that for very large sections we can
 * divide them into subsections.
 */
export declare function getGraphDocumentSections(document: vscode.TextDocument): Promise<DocumentSection[]>;
//# sourceMappingURL=sections.d.ts.map