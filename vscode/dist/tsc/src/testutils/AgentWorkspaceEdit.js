"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentWorkspaceEdit = void 0;
class AgentWorkspaceEdit {
    edits = [];
    get operations() {
        return Array.from(this.edits.values());
    }
    get size() {
        return this.edits.length;
    }
    has(uri) {
        const uriString = uri.toString();
        for (const operation of this.edits.values()) {
            switch (operation.type) {
                case 'create-file':
                case 'delete-file':
                case 'edit-file':
                    if (operation.uri === uriString) {
                        return true;
                    }
                    break;
                case 'rename-file':
                    if (operation.oldUri === uriString) {
                        return true;
                    }
            }
        }
        return false;
    }
    createFile(uri, options, metadata) {
        if (options?.contents && !(options.contents instanceof Uint8Array)) {
            throw new Error(`options.contents must be a Uint8Array. Unsupported argument ${options.contents}`);
        }
        this.edits.push({
            type: 'create-file',
            uri: uri.toString(),
            options: {
                overwrite: options?.overwrite,
                ignoreIfExists: options?.ignoreIfExists,
            },
            textContents: options?.contents instanceof Uint8Array ? options?.contents?.toString() : '',
            metadata,
        });
    }
    deleteFile(uri, options, metadata) {
        this.edits.push({
            type: 'delete-file',
            uri: uri.toString(),
            deleteOptions: options,
            metadata,
        });
    }
    renameFile(oldUri, newUri, options, metadata) {
        this.edits.push({
            type: 'rename-file',
            oldUri: oldUri.toString(),
            newUri: newUri.toString(),
            options,
            metadata,
        });
    }
    replace(uri, range, newText, metadata) {
        this.editOperation(uri).edits.push({
            type: 'replace',
            range,
            value: newText,
            metadata,
        });
    }
    insert(uri, position, content, metadata) {
        this.editOperation(uri).edits.push({
            type: 'insert',
            position,
            value: content,
            metadata,
        });
    }
    delete(uri, range, metadata) {
        this.editOperation(uri).edits.push({
            type: 'delete',
            range,
            metadata,
        });
    }
    editOperation(uri) {
        const uriString = uri.toString();
        for (const operation of this.edits.values()) {
            if (operation.type === 'edit-file' && operation.uri === uriString) {
                return operation;
            }
        }
        const result = {
            type: 'edit-file',
            uri: uri.toString(),
            edits: [],
        };
        this.edits.push(result);
        return result;
    }
    // ==================
    // Unimplemented APIs
    // ==================
    entries() {
        throw new Error('Method not implemented.');
    }
    set(uri, edits) {
        throw new Error('Method not implemented.');
    }
    get(uri) {
        // Not clear what to do about non-edit operations...
        throw new Error('Method not implemented.');
    }
}
exports.AgentWorkspaceEdit = AgentWorkspaceEdit;
