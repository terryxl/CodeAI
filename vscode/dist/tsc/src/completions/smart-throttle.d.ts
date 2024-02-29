/// <reference path="../../../../src/fileUri.d.ts" />
import { TriggerKind } from './get-inline-completions';
import type { RequestParams } from './request-manager';
import type * as vscode from 'vscode';
export declare const THROTTLE_TIMEOUT = 250;
export declare class SmartThrottleService implements vscode.Disposable {
    private startOfLineRequest;
    private startOfLineLocation;
    private tailRequest;
    private lastThrottlePromotion;
    throttle(request: RequestParams, triggerKind: TriggerKind): Promise<RequestParams | null>;
    private isNewStartOfLineRequest;
    dispose(): void;
}
//# sourceMappingURL=smart-throttle.d.ts.map