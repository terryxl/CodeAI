"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FixupFile = void 0;
/**
 * A handle to a fixup file. FixupFileObserver is the factory for these; do not
 * construct them directly.
 */
class FixupFile {
    id_;
    uri_;
    constructor(id_, uri_) {
        this.id_ = id_;
        this.uri_ = uri_;
    }
    deleted_ = false;
    get isDeleted() {
        return this.deleted_;
    }
    get uri() {
        return this.uri_;
    }
    toString() {
        return `FixupFile${this.id_}(${this.uri_})`;
    }
}
exports.FixupFile = FixupFile;
