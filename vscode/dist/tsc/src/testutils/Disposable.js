"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Disposable = void 0;
class Disposable {
    callOnDispose;
    static from(...disposableLikes) {
        return new Disposable(() => {
            for (const disposable of disposableLikes) {
                disposable.dispose();
            }
        });
    }
    constructor(callOnDispose) {
        this.callOnDispose = callOnDispose;
    }
    dispose() {
        this.callOnDispose();
    }
}
exports.Disposable = Disposable;
