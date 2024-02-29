"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FixupFileObserver = void 0;
const FixupFile_1 = require("./FixupFile");
/**
 * Watches documents for renaming and deletion. Hands out handles for documents
 * which are durable across renames and the documents being closed and reopened.
 * (The vscode.TextDocument object is *not* durable in this way.)
 */
class FixupFileObserver {
    uriToFile_ = new Map();
    n_ = 0; // cookie for generating new ids
    // TODO: Design memory management. There's no protocol for throwing away a
    // FixupFile.
    // TODO: Consider tracking documents being closed.
    /**
     * Given a document URI, provides the corresponding FixupFile. As the
     * document is renamed or deleted the FixupFile will be updated to provide
     * the current file URI. This creates a FixupFile if one does not exist and
     * starts tracking it; see maybeForUri.
     * @param uri the URI of the document to monitor.
     * @returns a new FixupFile representing the document.
     */
    forUri(uri) {
        let result = this.uriToFile_.get(uri.toString());
        if (!result) {
            result = this.newFile(uri);
            this.uriToFile_.set(uri.toString(), result);
        }
        return result;
    }
    /**
     * Gets the FixupFile for a given URI, if one exists. This operation is
     * fast; vscode event sinks which are provided a URI can use this to quickly
     * check whether the file may have fixups.
     * @param uri the URI of the document of interest.
     * @returns a FixupFile representing the document, if one exists.
     */
    maybeForUri(uri) {
        return this.uriToFile_.get(uri.toString());
    }
    replaceFile(uri, newUri) {
        this.uriToFile_.delete(uri.toString());
        return this.forUri(newUri);
    }
    newFile(uri) {
        return new FixupFile_1.FixupFile(this.n_++, uri);
    }
    didDeleteFiles(event) {
        // TODO: There is only one delete event for a folder. Scan all of the
        // Uris to find sub-files and compute their new name.
        for (const uri of event.files) {
            const file = this.uriToFile_.get(uri.toString());
            if (file) {
                file.deleted_ = true;
                this.uriToFile_.delete(uri.toString());
            }
        }
    }
    didRenameFiles(event) {
        // TODO: There is only one rename event for a folder. Scan all of the
        // Uris to find sub-files and compute their new name.
        for (const { oldUri, newUri } of event.files) {
            const file = this.uriToFile_.get(oldUri.toString());
            if (file) {
                this.uriToFile_.delete(oldUri.toString());
                this.uriToFile_.set(newUri.toString(), file);
                file.uri_ = newUri;
            }
        }
    }
}
exports.FixupFileObserver = FixupFileObserver;
