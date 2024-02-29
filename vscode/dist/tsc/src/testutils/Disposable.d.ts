/// <reference path="../../../../src/fileUri.d.ts" />
import type { Disposable as VSCodeDisposable } from 'vscode';
export declare class Disposable implements VSCodeDisposable {
    private readonly callOnDispose;
    static from(...disposableLikes: {
        dispose: () => any;
    }[]): Disposable;
    constructor(callOnDispose: () => any);
    dispose(): void;
}
//# sourceMappingURL=Disposable.d.ts.map