import type { init as browserInit } from '@sentry/browser';
import type { init as nodeInit } from '@sentry/node';
import { type ConfigurationWithAccessToken } from '@sourcegraph/cody-shared';
export * from '@sentry/core';
export type SentryOptions = NonNullable<Parameters<typeof nodeInit | typeof browserInit>[0]>;
export declare abstract class SentryService {
    protected config: Pick<ConfigurationWithAccessToken, 'serverEndpoint' | 'isRunningInsideAgent' | 'agentIDE'>;
    constructor(config: Pick<ConfigurationWithAccessToken, 'serverEndpoint' | 'isRunningInsideAgent' | 'agentIDE'>);
    onConfigurationChange(newConfig: Pick<ConfigurationWithAccessToken, 'serverEndpoint'>): void;
    private prepareReconfigure;
    protected abstract reconfigure(options: Parameters<typeof nodeInit | typeof browserInit>[0]): void;
}
export declare function shouldErrorBeReported(error: unknown): boolean;
//# sourceMappingURL=sentry.d.ts.map