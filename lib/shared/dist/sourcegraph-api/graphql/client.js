import fetch from 'isomorphic-fetch';
import { URI } from 'vscode-uri';
import { logDebug, logError } from '../../logger';
import { addTraceparent, wrapInActiveSpan } from '../../tracing';
import { isError } from '../../utils';
import { DOTCOM_URL, DOTCOM_AZURE_URL, isDotCom } from '../environments';
import { CONTEXT_SEARCH_QUERY, CURRENT_SITE_CODY_CONFIG_FEATURES, CURRENT_SITE_CODY_LLM_CONFIGURATION, CURRENT_SITE_CODY_LLM_PROVIDER, CURRENT_SITE_GRAPHQL_FIELDS_QUERY, CURRENT_SITE_HAS_CODY_ENABLED_QUERY, CURRENT_SITE_IDENTIFICATION, CURRENT_SITE_VERSION_QUERY, CURRENT_USER_CODY_PRO_ENABLED_QUERY, CURRENT_USER_CODY_SUBSCRIPTION_QUERY, CURRENT_USER_ID_QUERY, CURRENT_USER_INFO_QUERY, EVALUATE_FEATURE_FLAG_QUERY, GET_FEATURE_FLAGS_QUERY, LOG_EVENT_MUTATION, LOG_EVENT_MUTATION_DEPRECATED, RECORD_TELEMETRY_EVENTS_MUTATION, REPOSITORY_ID_QUERY, REPOSITORY_IDS_QUERY, REPOSITORY_LIST_QUERY, SEARCH_ATTRIBUTION_QUERY, } from './queries';
import { buildGraphQLUrl } from './url';
export function isNodeResponse(response) {
    return Boolean(response.body && !('getReader' in response.body));
}
const isAgentTesting = process.env.CODY_SHIM_TESTING === 'true';
function extractDataOrError(response, extract) {
    if (isError(response)) {
        return response;
    }
    if (response.errors && response.errors.length > 0) {
        return new Error(response.errors.map(({ message }) => message).join(', '));
    }
    if (!response.data) {
        return new Error('response is missing data');
    }
    return extract(response.data);
}
export let customUserAgent;
export function addCustomUserAgent(headers) {
    if (customUserAgent) {
        headers.set('User-Agent', customUserAgent);
    }
}
export function setUserAgent(newUseragent) {
    customUserAgent = newUseragent;
}
const QUERY_TO_NAME_REGEXP = /^\s*(?:query|mutation)\s+(\w+)/m;
export class SourcegraphGraphQLAPIClient {
    dotcomUrl = DOTCOM_URL;
    anonymousUserID;
    /**
     * Should be set on extension activation via `localStorage.onConfigurationChange(config)`
     * Done to avoid passing the graphql client around as a parameter and instead
     * access it as a singleton via the module import.
     */
    _config = null;
    get config() {
        if (!this._config) {
            throw new Error('GraphQLAPIClientConfig is not set');
        }
        return this._config;
    }
    constructor(config = null) {
        this._config = config;
        this.dotcomUrl = config?.modelsVendor === 'Azure' ? DOTCOM_AZURE_URL : DOTCOM_URL;
    }
    onConfigurationChange(newConfig) {
        this._config = newConfig;
    }
    /**
     * If set, anonymousUID is trasmitted as 'X-Sourcegraph-Actor-Anonymous-UID'
     * which is automatically picked up by Sourcegraph backends 5.2+
     */
    setAnonymousUserID(anonymousUID) {
        this.anonymousUserID = anonymousUID;
    }
    isDotCom() {
        return isDotCom(this.config.serverEndpoint);
    }
    // Gets the server endpoint for this client.
    get endpoint() {
        return this.config.serverEndpoint;
    }
    async getSiteVersion() {
        if (!this.isDotCom())
            return "264357_2024-03-08_5.3-04cd87dc07d4";
        return this.fetchSourcegraphAPI(CURRENT_SITE_VERSION_QUERY, {})
            .then(response => extractDataOrError(response, data => data.site?.productVersion ?? new Error('site version not found')));
    }
    async getSiteIdentification() {
        if (!this.isDotCom())
            return new Error('site ID not found');
        const response = await this.fetchSourcegraphAPI(CURRENT_SITE_IDENTIFICATION, {});
        return extractDataOrError(response, data => data.site?.siteID
            ? data.site?.productSubscription?.license?.hashedKey
                ? {
                    siteid: data.site?.siteID,
                    hashedLicenseKey: data.site?.productSubscription?.license?.hashedKey,
                }
                : new Error('site hashed license key not found')
            : new Error('site ID not found'));
    }
    async getSiteHasIsCodyEnabledField() {
        if (!this.isDotCom())
            return false;
        return this.fetchSourcegraphAPI(CURRENT_SITE_GRAPHQL_FIELDS_QUERY, {}).then(response => extractDataOrError(response, data => !!data.__type?.fields?.find(field => field.name === 'isCodyEnabled')));
    }
    async getSiteHasCodyEnabled() {
        if (!this.isDotCom())
            return false;
        return this.fetchSourcegraphAPI(CURRENT_SITE_HAS_CODY_ENABLED_QUERY, {}).then(response => extractDataOrError(response, data => data.site?.isCodyEnabled ?? false));
    }
    async getCurrentUserId() {
        if (!this.isDotCom())
            return '';
        return this.fetchSourcegraphAPI(CURRENT_USER_ID_QUERY, {}).then(response => extractDataOrError(response, data => data.currentUser ? data.currentUser.id : new Error('current user not found')));
    }
    async getCurrentUserCodyProEnabled() {
        if (!this.isDotCom())
            return new Error('current user not found');
        return this.fetchSourcegraphAPI(CURRENT_USER_CODY_PRO_ENABLED_QUERY, {}).then(response => extractDataOrError(response, data => data.currentUser ? { ...data.currentUser } : new Error('current user not found')));
    }
    async getCurrentUserCodySubscription() {
        if (!this.isDotCom())
            return new Error();
        return this.fetchSourcegraphAPI(CURRENT_USER_CODY_SUBSCRIPTION_QUERY, {}).then(response => extractDataOrError(response, data => data.currentUser?.codySubscription
            ? data.currentUser.codySubscription
            : new Error('current user subscription data not found')));
    }
    async getCurrentUserInfo() {
        if (!this.isDotCom())
            return {
                id: "test",
                hasVerifiedEmail: true,
                username: 'test',
                displayName: 'Test',
                avatarURL: '',
                primaryEmail: { email: 'test@haier.com' },
            };
        return this.fetchSourcegraphAPI(CURRENT_USER_INFO_QUERY, {}).then(response => extractDataOrError(response, data => data.currentUser ? { ...data.currentUser } : new Error('current user not found')));
    }
    /**
     * Fetches the Site Admin enabled/disable Cody config features for the current instance.
     */
    async getCodyConfigFeatures() {
        if (!this.isDotCom())
            return new Error('cody config not found');
        const response = await this.fetchSourcegraphAPI(CURRENT_SITE_CODY_CONFIG_FEATURES, {});
        return extractDataOrError(response, data => data.site?.codyConfigFeatures ?? new Error('cody config not found'));
    }
    async getCodyLLMConfiguration() {
        // fetch Cody LLM provider separately for backward compatability
        if (!this.isDotCom())
            return;
        const [configResponse, providerResponse] = await Promise.all([
            this.fetchSourcegraphAPI(CURRENT_SITE_CODY_LLM_CONFIGURATION),
            this.fetchSourcegraphAPI(CURRENT_SITE_CODY_LLM_PROVIDER),
        ]);
        const config = extractDataOrError(configResponse, data => data.site?.codyLLMConfiguration || undefined);
        if (!config || isError(config)) {
            return config;
        }
        let provider;
        const llmProvider = extractDataOrError(providerResponse, data => data.site?.codyLLMConfiguration?.provider);
        if (llmProvider && !isError(llmProvider)) {
            provider = llmProvider;
        }
        return { ...config, provider };
    }
    /**
     * Gets a subset of the list of repositories from the Sourcegraph instance.
     * @param first the number of repositories to retrieve.
     * @param after the last repository retrieved, if any, to continue enumerating the list.
     * @returns the list of repositories. If `endCursor` is null, this is the end of the list.
     */
    async getRepoList(first, after) {
        if (!this.isDotCom())
            return {};
        return this.fetchSourcegraphAPI(REPOSITORY_LIST_QUERY, {
            first,
            after: after || null,
        }).then(response => extractDataOrError(response, data => data));
    }
    async getRepoId(repoName) {
        if (!this.isDotCom())
            return null;
        return this.fetchSourcegraphAPI(REPOSITORY_ID_QUERY, {
            name: repoName,
        }).then(response => extractDataOrError(response, data => (data.repository ? data.repository.id : null)));
    }
    async getRepoIds(names, first) {
        if (!this.isDotCom())
            return [];
        return this.fetchSourcegraphAPI(REPOSITORY_IDS_QUERY, {
            names,
            first,
        }).then(response => extractDataOrError(response, data => data.repositories?.nodes || []));
    }
    async contextSearch(repos, query) {
        if (!this.isDotCom())
            return null;
        return this.fetchSourcegraphAPI(CONTEXT_SEARCH_QUERY, {
            repos: [...repos],
            query,
            codeResultsCount: 15,
            textResultsCount: 5,
        }).then(response => extractDataOrError(response, data => (data.getCodyContext || []).map(item => ({
            commit: item.blob.commit.oid,
            repoName: item.blob.repository.name,
            path: item.blob.path,
            uri: URI.parse(`${item.blob.url.startsWith('/') ? this.endpoint : ''}${item.blob.url}?L${item.startLine + 1}-${item.endLine}`),
            startLine: item.startLine,
            endLine: item.endLine,
            content: item.chunkContent,
        }))));
    }
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
    async isCodyEnabled() {
        // Check site version.
        const siteVersion = await this.getSiteVersion();
        if (isError(siteVersion)) {
            return { enabled: false, version: 'unknown' };
        }
        const insiderBuild = siteVersion.length > 12 || siteVersion.includes('dev');
        if (insiderBuild) {
            return { enabled: true, version: siteVersion };
        }
        // NOTE: Cody does not work on versions older than 5.0
        const versionBeforeCody = siteVersion < '5.0.0';
        if (versionBeforeCody) {
            return { enabled: false, version: siteVersion };
        }
        // Beta version is betwewen 5.0.0 - 5.1.0 and does not have isCodyEnabled field
        const betaVersion = siteVersion >= '5.0.0' && siteVersion < '5.1.0';
        const hasIsCodyEnabledField = await this.getSiteHasIsCodyEnabledField();
        // The isCodyEnabled field does not exist before version 5.1.0
        if (!betaVersion && !isError(hasIsCodyEnabledField) && hasIsCodyEnabledField) {
            const siteHasCodyEnabled = await this.getSiteHasCodyEnabled();
            return { enabled: !isError(siteHasCodyEnabled) && siteHasCodyEnabled, version: siteVersion };
        }
        return { enabled: insiderBuild || betaVersion, version: siteVersion };
    }
    /**
     * recordTelemetryEvents uses the new Telemetry API to record events that
     * gets exported: https://sourcegraph.com/docs/dev/background-information/telemetry
     *
     * Only available on Sourcegraph 5.2.0 and later.
     *
     * DO NOT USE THIS DIRECTLY - use an implementation of implementation
     * TelemetryRecorder from '@sourcegraph/telemetry' instead.
     */
    async recordTelemetryEvents(events) {
        if (!this.isDotCom())
            return;
        for (const event of events) {
            this.anonymizeTelemetryEventInput(event);
        }
        const initialResponse = await this.fetchSourcegraphAPI(RECORD_TELEMETRY_EVENTS_MUTATION, {
            events,
        });
        return extractDataOrError(initialResponse, data => data);
    }
    /**
     * logEvent is the legacy event-logging mechanism.
     * @deprecated use an implementation of implementation TelemetryRecorder
     * from '@sourcegraph/telemetry' instead.
     */
    async logEvent(event, mode) {
        if (process.env.CODY_TESTING === 'true') {
            return this.sendEventLogRequestToTestingAPI(event);
        }
        if (this.config?.telemetryLevel === 'off') {
            return {};
        }
        /**
         * If connected to dotcom, just log events to the instance, as it means
         * the same thing.
         */
        if (this.isDotCom()) {
            return this.sendEventLogRequestToAPI(event);
        }
        switch (process.env.CODY_LOG_EVENT_MODE) {
            case 'connected-instance-only':
                mode = 'connected-instance-only';
                break;
            case 'dotcom-only':
                mode = 'dotcom-only';
                break;
            case 'all':
                mode = 'all';
                break;
            default:
                if (process.env.CODY_LOG_EVENT_MODE) {
                    logDebug('SourcegraphGraphQLAPIClient.logEvent', 'unknown mode', process.env.CODY_LOG_EVENT_MODE);
                }
        }
        switch (mode) {
            /**
             * Only log events to dotcom, not the connected instance. Used when
             * another mechanism delivers event logs the instance (i.e. the
             * new telemetry clients)
             */
            case 'dotcom-only':
                return this.sendEventLogRequestToDotComAPI(event);
            /**
             * Only log events to the connected instance, not dotcom. Used when
             * another mechanism handles reporting to dotcom (i.e. the old
             * client and/or the new telemetry framework, which exports events
             * from all instances: https://sourcegraph.com/docs/dev/background-information/telemetry)
             */
            case 'connected-instance-only':
                return this.sendEventLogRequestToAPI(event);
            case 'all': // continue to default handling
        }
        /**
         * Otherwise, send events to the connected instance AND to dotcom (default)
         */
        const responses = await Promise.all([
            this.sendEventLogRequestToAPI(event),
            this.sendEventLogRequestToDotComAPI(event),
        ]);
        if (isError(responses[0]) && isError(responses[1])) {
            return new Error(`Errors logging events: ${responses[0].toString()}, ${responses[1].toString()}`);
        }
        if (isError(responses[0])) {
            return responses[0];
        }
        if (isError(responses[1])) {
            return responses[1];
        }
        return {};
    }
    anonymizeTelemetryEventInput(event) {
        if (isAgentTesting) {
            event.timestamp = undefined;
            event.parameters.interactionID = undefined;
            event.parameters.billingMetadata = undefined;
            event.parameters.metadata = undefined;
            event.parameters.metadata = undefined;
            event.parameters.privateMetadata = {};
        }
    }
    anonymizeEvent(event) {
        if (isAgentTesting) {
            event.publicArgument = undefined;
            event.argument = undefined;
            event.userCookieID = 'ANONYMOUS_USER_COOKIE_ID';
            event.hashedLicenseKey = undefined;
        }
    }
    async sendEventLogRequestToDotComAPI(event) {
        if (!this.isDotCom())
            return;
        this.anonymizeEvent(event);
        const response = await this.fetchSourcegraphDotcomAPI(LOG_EVENT_MUTATION, event);
        return extractDataOrError(response, data => data);
    }
    async sendEventLogRequestToAPI(event) {
        if (!this.isDotCom())
            return;
        this.anonymizeEvent(event);
        const initialResponse = await this.fetchSourcegraphAPI(LOG_EVENT_MUTATION, event);
        const initialDataOrError = extractDataOrError(initialResponse, data => data);
        if (isError(initialDataOrError)) {
            const secondResponse = await this.fetchSourcegraphAPI(LOG_EVENT_MUTATION_DEPRECATED, event);
            return extractDataOrError(secondResponse, data => data);
        }
        return initialDataOrError;
    }
    async sendEventLogRequestToTestingAPI(event) {
        const initialResponse = await this.fetchSourcegraphTestingAPI(event);
        const initialDataOrError = extractDataOrError(initialResponse, data => data);
        if (isError(initialDataOrError)) {
            const secondResponse = await this.fetchSourcegraphTestingAPI(event);
            return extractDataOrError(secondResponse, data => data);
        }
        return initialDataOrError;
    }
    async searchAttribution(snippet) {
        if (!this.isDotCom())
            return null;
        return this.fetchSourcegraphAPI(SEARCH_ATTRIBUTION_QUERY, {
            snippet,
        }).then(response => extractDataOrError(response, data => data.snippetAttribution));
    }
    async getEvaluatedFeatureFlags() {
        if (!this.isDotCom())
            return {};
        return this.fetchSourcegraphAPI(GET_FEATURE_FLAGS_QUERY, {}).then(response => {
            return extractDataOrError(response, data => data.evaluatedFeatureFlags.reduce((acc, { name, value }) => {
                acc[name] = value;
                return acc;
            }, {}));
        });
    }
    async evaluateFeatureFlag(flagName) {
        if (!this.isDotCom())
            return null;
        return this.fetchSourcegraphAPI(EVALUATE_FEATURE_FLAG_QUERY, {
            flagName,
        }).then(response => extractDataOrError(response, data => data.evaluateFeatureFlag));
    }
    fetchSourcegraphAPI(query, variables = {}) {
        const headers = new Headers(this.config.customHeaders);
        headers.set('Content-Type', 'application/json; charset=utf-8');
        if (this.config.accessToken) {
            headers.set('Authorization', `token ${this.config.accessToken}`);
        }
        else if (this.anonymousUserID) {
            headers.set('X-Sourcegraph-Actor-Anonymous-UID', this.anonymousUserID);
        }
        addTraceparent(headers);
        addCustomUserAgent(headers);
        const queryName = query.match(QUERY_TO_NAME_REGEXP)?.[1];
        const url = buildGraphQLUrl({ request: query, baseUrl: this.config.serverEndpoint });
        return wrapInActiveSpan(`graphql.fetch${queryName ? `.${queryName}` : ''}`, () => fetch(url, {
            method: 'POST',
            body: JSON.stringify({ query, variables }),
            headers,
        })
            .then(verifyResponseCode)
            .then(response => response.json())
            .catch(error => {
            return new Error(`accessing Sourcegraph GraphQL API: ${error} (${url})`);
        }));
    }
    // make an anonymous request to the dotcom API
    fetchSourcegraphDotcomAPI(query, variables) {
        const url = buildGraphQLUrl({ request: query, baseUrl: this.dotcomUrl.href });
        const headers = new Headers();
        addCustomUserAgent(headers);
        addTraceparent(headers);
        const queryName = query.match(QUERY_TO_NAME_REGEXP)?.[1];
        return wrapInActiveSpan(`graphql.dotcom.fetch${queryName ? `.${queryName}` : ''}`, () => fetch(url, {
            method: 'POST',
            body: JSON.stringify({ query, variables }),
            headers,
        })
            .then(verifyResponseCode)
            .then(response => response.json())
            .catch(error => new Error(`error fetching Sourcegraph GraphQL API: ${error} (${url})`)));
    }
    // make an anonymous request to the Testing API
    fetchSourcegraphTestingAPI(body) {
        const url = 'http://localhost:49300/.api/testLogging';
        const headers = new Headers({
            'Content-Type': 'application/json',
        });
        addCustomUserAgent(headers);
        return fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify(body),
        })
            .then(verifyResponseCode)
            .then(response => response.json())
            .catch(error => new Error(`error fetching Testing Sourcegraph API: ${error} (${url})`));
    }
}
/**
 * Singleton instance of the graphql client.
 * Should be configured on the extension activation via `graphqlClient.onConfigurationChange(config)`.
 */
export const graphqlClient = new SourcegraphGraphQLAPIClient();
/**
 * ConfigFeaturesSingleton is a class that manages the retrieval
 * and caching of configuration features from GraphQL endpoints.
 */
export class ConfigFeaturesSingleton {
    static instance;
    configFeatures;
    // Constructor is private to prevent creating new instances outside of the class
    constructor() {
        // Initialize with default values
        this.configFeatures = Promise.resolve({
            chat: true,
            autoComplete: true,
            commands: true,
            attribution: false,
        });
        // Initiate the first fetch and set up a recurring fetch every 30 seconds
        if (graphqlClient.isDotCom())
            this.refreshConfigFeatures();
        // // Fetch config features periodically every 30 seconds only if isDotCom is false
        // if (!graphqlClient.isDotCom()) {
        //     setInterval(() => this.refreshConfigFeatures(), 30000)
        // } HAIAR MOCKING
    }
    // Static method to get the singleton instance
    static getInstance() {
        if (!ConfigFeaturesSingleton.instance) {
            ConfigFeaturesSingleton.instance = new ConfigFeaturesSingleton();
        }
        return ConfigFeaturesSingleton.instance;
    }
    // Refreshes the config features by fetching them from the server and caching the result
    refreshConfigFeatures() {
        const previousConfigFeatures = this.configFeatures;
        this.configFeatures = this.fetchConfigFeatures().catch((error) => {
            // Ignore fetcherrors as older SG instances will always face this because their GQL is outdated
            if (!(error.message.includes('FetchError') || error.message.includes('Cannot query field'))) {
                logError('ConfigFeaturesSingleton', 'refreshConfigFeatures', error.message);
            }
            // In case of an error, return previously fetched value
            return previousConfigFeatures;
        });
    }
    getConfigFeatures() {
        return this.configFeatures;
    }
    // Fetches the config features from the server and handles errors
    async fetchConfigFeatures() {
        // Execute the GraphQL query to fetch the configuration features
        const features = await graphqlClient.getCodyConfigFeatures();
        if (features instanceof Error) {
            // If there's an error, throw it to be caught in refreshConfigFeatures
            throw features;
        }
        // If the fetch is successful, store the fetched configuration features
        return features;
    }
}
async function verifyResponseCode(response) {
    if (!response.ok) {
        const body = await response.text();
        throw new Error(`HTTP status code ${response.status}${body ? `: ${body}` : ''}`);
    }
    return response;
}
//# sourceMappingURL=client.js.map