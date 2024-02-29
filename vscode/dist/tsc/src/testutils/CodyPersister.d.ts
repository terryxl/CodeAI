import type { Har } from '@pollyjs/persister';
import FSPersister from '@pollyjs/persister-fs';
import { PollyYamlWriter } from './pollyapi';
/**
 * SHA-256 digests a Sourcegraph access token so that it's value is redacted but
 * remains uniquely identifyable. The token needs to be uniquely identifiable so
 * that we can correctly replay HTTP responses based on the access token.
 */
export declare function redactAccessToken(token: string): string;
/**
 * The default file system persister with the following customizations
 *
 * - Replaces Cody access tokens with the string "REDACTED" because we don't
 *   want to commit the access token into git.
 * - To avoid diff churn/conflicts:
 *   - Sets date headers to a known static date
 *   - Removes cookies
 *   - Sets dates/timing information stored by Polly to static values
 */
export declare class CodyPersister extends FSPersister {
    api: PollyYamlWriter;
    constructor(polly: any);
    static get id(): string;
    onFindRecording(recordingId: string): Promise<Har | null>;
    onSaveRecording(recordingId: string, recording: Har): Promise<void>;
    private filterHeaders;
}
//# sourceMappingURL=CodyPersister.d.ts.map