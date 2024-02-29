/// <reference path="../../../src/fileUri.d.ts" />
import type { ExtensionMode } from 'vscode';
import { TestSupport } from './test-support';
export declare class ExtensionApi {
    extensionMode: ExtensionMode;
    testing: TestSupport | undefined;
    constructor(extensionMode: ExtensionMode);
}
//# sourceMappingURL=extension-api.d.ts.map