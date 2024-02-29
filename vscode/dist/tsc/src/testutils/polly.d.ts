import { Polly, type EXPIRY_STRATEGY, type MODE } from '@pollyjs/core';
interface PollyOptions {
    recordingName: string;
    keepUnusedRecordings?: boolean;
    recordingDirectory?: string;
    recordIfMissing?: boolean;
    recordingMode?: MODE;
    recordingExpiryStrategy?: EXPIRY_STRATEGY;
    expiresIn?: string | null;
}
export declare function startPollyRecording(userOptions: PollyOptions): Polly;
export {};
//# sourceMappingURL=polly.d.ts.map