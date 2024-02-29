import type { Response as NodeResponse } from 'node-fetch';
import { URI } from 'vscode-uri';
import type { TelemetryEventInput } from '@sourcegraph/telemetry';
import type { ConfigurationWithAccessToken } from '../../configuration';
export type BrowserOrNodeResponse = Response | NodeResponse;
export declare function isNodeResponse(response: BrowserOrNodeResponse): response is NodeResponse;
interface CodyConfigFeatures {
    chat: boolean;
    autoComplete: boolean;
    commands: boolean;
    attribution: boolean;
}
export interface RepoListResponse {
    repositories: {
        nodes: {
            name: string;
            id: string;
        }[];
        pageInfo: {
            endCursor: string | null;
        };
    };
}
type LogEventResponse = unknown;
export interface EmbeddingsSearchResult {
    repoName?: string;
    revision?: string;
    uri: URI;
    startLine: number;
    endLine: number;
    content: string;
}
export interface ContextSearchResult {
    repoName: string;
    commit: string;
    uri: URI;
    path: string;
    startLine: number;
    endLine: number;
    content: string;
}
interface SearchAttributionResults {
    limitHit: boolean;
    nodes: {
        repositoryName: string;
    }[];
}
export interface CodyLLMSiteConfiguration {
    chatModel?: string;
    chatModelMaxTokens?: number;
    fastChatModel?: string;
    fastChatModelMaxTokens?: number;
    completionModel?: string;
    completionModelMaxTokens?: number;
    provider?: string;
}
export interface CurrentUserCodySubscription {
    status: string;
    plan: string;
    applyProRateLimits: boolean;
    currentPeriodStartAt: Date;
    currentPeriodEndAt: Date;
}
interface CurrentUserInfo {
    id: string;
    hasVerifiedEmail: boolean;
    username: string;
    displayName?: string;
    avatarURL: string;
    primaryEmail?: {
        email: string;
    } | null;
}
/**
 * @deprecated Use 'TelemetryEvent' instead.
 */
export interface event {
    event: string;
    userCookieID: string;
    url: string;
    source: string;
    argument?: string | unknown;
    publicArgument?: string | unknown;
    client: string;
    connectedSiteID?: string;
    hashedLicenseKey?: string;
}
export type GraphQLAPIClientConfig = Pick<ConfigurationWithAccessToken, 'serverEndpoint' | 'accessToken' | 'customHeaders'> & Pick<Partial<ConfigurationWithAccessToken>, 'telemetryLevel'>;
export declare let customUserAgent: string | undefined;
export declare function addCustomUserAgent(headers: Headers): void;
export declare function setUserAgent(newUseragent: string): void;
export declare class SourcegraphGraphQLAPIClient {
    private dotcomUrl;
    anonymousUserID: string | undefined;
    /**
     * Should be set on extension activation via `localStorage.onConfigurationChange(config)`
     * Done to avoid passing the graphql client around as a parameter and instead
     * access it as a singleton via the module import.
     */
    private _config;
    private get config();
    constructor(config?: GraphQLAPIClientConfig | null);
    onConfigurationChange(newConfig: GraphQLAPIClientConfig): void;
    /**
     * If set, anonymousUID is trasmitted as 'X-Sourcegraph-Actor-Anonymous-UID'
     * which is automatically picked up by Sourcegraph backends 5.2+
     */
    setAnonymousUserID(anonymousUID: string): void;
    isDotCom(): boolean;
    get endpoint(): string;
    getSiteVersion(): Promise<string | Error>;
    getSiteIdentification(): Promise<{
        siteid: string;
        hashedLicenseKey: string;
    } | Error>;
    getSiteHasIsCodyEnabledField(): Promise<boolean | Error>;
    getSiteHasCodyEnabled(): Promise<boolean | Error>;
    getCurrentUserId(): Promise<string | Error>;
    getCurrentUserCodyProEnabled(): Promise<{
        codyProEnabled: boolean;
    } | Error>;
    getCurrentUserCodySubscription(): Promise<CurrentUserCodySubscription | Error>;
    getCurrentUserInfo(): Promise<CurrentUserInfo | Error>;
    /**
     * Fetches the Site Admin enabled/disable Cody config features for the current instance.
     */
    getCodyConfigFeatures(): Promise<CodyConfigFeatures | Error>;
    getCodyLLMConfiguration(): Promise<undefined | CodyLLMSiteConfiguration | Error>;
    /**
     * Gets a subset of the list of repositories from the Sourcegraph instance.
     * @param first the number of repositories to retrieve.
     * @param after the last repository retrieved, if any, to continue enumerating the list.
     * @returns the list of repositories. If `endCursor` is null, this is the end of the list.
     */
    getRepoList(first: number, after?: string): Promise<RepoListResponse | Error>;
    getRepoId(repoName: string): Promise<string | null | Error>;
    getRepoIds(names: string[], first: number): Promise<{
        name: string;
        id: string;
    }[] | Error>;
    contextSearch(repos: Set<string>, query: string): Promise<ContextSearchResult[] | null | Error>;
    /**
     * Checks if Cody is enabled on the current Sourcegraph instance.
     * @returns
     * enabled: Whether Cody is enabled.
     * version: The Sourcegraph version.
     *
     * This method first checks the Sourcegraph version using `getSiteVersion()`.
     * If the version is before 5.0.0, Cody is disabled.
     * If the version is 5.0.0 or newer, it checks for the existence of the `isCodyEnabled` field using `getSiteHasIsCodyEnabledField()`.
     * If the field exists, it calls `getSiteHasCodyEnabled()` to check its value.
     * If the field does not exist, Cody is assumed to be enabled for versions between 5.0.0 - 5.1.0.
     */
    isCodyEnabled(): Promise<{
        enabled: boolean;
        version: string;
    }>;
    /**
     * recordTelemetryEvents uses the new Telemetry API to record events that
     * gets exported: https://sourcegraph.com/docs/dev/background-information/telemetry
     *
     * Only available on Sourcegraph 5.2.0 and later.
     *
     * DO NOT USE THIS DIRECTLY - use an implementation of implementation
     * TelemetryRecorder from '@sourcegraph/telemetry' instead.
     */
    recordTelemetryEvents(events: TelemetryEventInput[]): Promise<unknown | Error>;
    /**
     * logEvent is the legacy event-logging mechanism.
     * @deprecated use an implementation of implementation TelemetryRecorder
     * from '@sourcegraph/telemetry' instead.
     */
    logEvent(event: event, mode: LogEventMode): Promise<LogEventResponse | Error>;
    private anonymizeTelemetryEventInput;
    private anonymizeEvent;
    private sendEventLogRequestToDotComAPI;
    private sendEventLogRequestToAPI;
    private sendEventLogRequestToTestingAPI;
    searchAttribution(snippet: string): Promise<SearchAttributionResults | Error>;
    getEvaluatedFeatureFlags(): Promise<Record<string, boolean> | Error>;
    evaluateFeatureFlag(flagName: string): Promise<boolean | null | Error>;
    private fetchSourcegraphAPI;
    private fetchSourcegraphDotcomAPI;
    private fetchSourcegraphTestingAPI;
}
/**
 * Singleton instance of the graphql client.
 * Should be configured on the extension activation via `graphqlClient.onConfigurationChange(config)`.
 */
export declare const graphqlClient: SourcegraphGraphQLAPIClient;
/**
 * ConfigFeaturesSingleton is a class that manages the retrieval
 * and caching of configuration features from GraphQL endpoints.
 */
export declare class ConfigFeaturesSingleton {
    private static instance;
    private configFeatures;
    private constructor();
    static getInstance(): ConfigFeaturesSingleton;
    private refreshConfigFeatures;
    getConfigFeatures(): Promise<CodyConfigFeatures>;
    private fetchConfigFeatures;
}
export type LogEventMode = 'dotcom-only' | 'connected-instance-only' | 'all';
export {};
//# sourceMappingURL=client.d.ts.map