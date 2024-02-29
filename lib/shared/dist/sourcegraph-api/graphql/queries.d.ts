export declare const CURRENT_USER_ID_QUERY = "\nquery CurrentUser {\n    currentUser {\n        id\n    }\n}";
export declare const CURRENT_USER_CODY_PRO_ENABLED_QUERY = "\nquery CurrentUserCodyProEnabled {\n    currentUser {\n        codyProEnabled\n    }\n}";
export declare const CURRENT_USER_CODY_SUBSCRIPTION_QUERY = "\nquery CurrentUserCodySubscription {\n    currentUser {\n        codySubscription {\n            status\n            plan\n            applyProRateLimits\n            currentPeriodStartAt\n            currentPeriodEndAt\n        }\n    }\n}";
export declare const CURRENT_USER_INFO_QUERY = "\nquery CurrentUser {\n    currentUser {\n        id\n        hasVerifiedEmail\n        displayName\n        username\n        avatarURL\n        primaryEmail {\n            email\n        }\n    }\n}";
export declare const CURRENT_SITE_VERSION_QUERY = "\nquery SiteProductVersion {\n    site {\n        productVersion\n    }\n}";
export declare const CURRENT_SITE_HAS_CODY_ENABLED_QUERY = "\nquery SiteHasCodyEnabled {\n    site {\n        isCodyEnabled\n    }\n}";
export declare const CURRENT_SITE_GRAPHQL_FIELDS_QUERY = "\nquery SiteGraphQLFields {\n    __type(name: \"Site\") {\n        fields {\n            name\n        }\n    }\n}";
export declare const CURRENT_SITE_CODY_LLM_PROVIDER = "\nquery CurrentSiteCodyLlmConfiguration {\n    site {\n        codyLLMConfiguration {\n            provider\n        }\n    }\n}";
export declare const CURRENT_SITE_CODY_CONFIG_FEATURES = "\nquery CodyConfigFeaturesResponse {\n    site {\n        codyConfigFeatures {\n            chat\n            autoComplete\n            commands\n            attribution\n        }\n    }\n}";
export declare const CURRENT_SITE_CODY_LLM_CONFIGURATION = "\nquery CurrentSiteCodyLlmConfiguration {\n    site {\n        codyLLMConfiguration {\n            chatModel\n            chatModelMaxTokens\n            fastChatModel\n            fastChatModelMaxTokens\n            completionModel\n            completionModelMaxTokens\n        }\n    }\n}";
export declare const REPOSITORY_LIST_QUERY = "\nquery Repositories($first: Int!, $after: String) {\n    repositories(first: $first, after: $after) {\n        nodes {\n            id\n            name\n            url\n        }\n        pageInfo {\n            endCursor\n        }\n    }\n}\n";
export declare const REPOSITORY_ID_QUERY = "\nquery Repository($name: String!) {\n\trepository(name: $name) {\n\t\tid\n\t}\n}";
export declare const REPOSITORY_IDS_QUERY = "\nquery Repositories($names: [String!]!, $first: Int!) {\n    repositories(names: $names, first: $first) {\n      nodes {\n        name\n        id\n      }\n    }\n  }\n";
export declare const CONTEXT_SEARCH_QUERY = "\nquery GetCodyContext($repos: [ID!]!, $query: String!, $codeResultsCount: Int!, $textResultsCount: Int!) {\n\tgetCodyContext(repos: $repos, query: $query, codeResultsCount: $codeResultsCount, textResultsCount: $textResultsCount) {\n        ...on FileChunkContext {\n            blob {\n                path\n                repository {\n                  id\n                  name\n                }\n                commit {\n                  oid\n                }\n                url\n              }\n              startLine\n              endLine\n              chunkContent\n        }\n    }\n}";
export declare const SEARCH_ATTRIBUTION_QUERY = "\nquery SnippetAttribution($snippet: String!) {\n    snippetAttribution(snippet: $snippet) {\n        limitHit\n        nodes {\n            repositoryName\n        }\n    }\n}";
/**
 * Deprecated following new event structure: https://github.com/sourcegraph/sourcegraph/pull/55126.
 */
export declare const LOG_EVENT_MUTATION_DEPRECATED = "\nmutation LogEventMutation($event: String!, $userCookieID: String!, $url: String!, $source: EventSource!, $argument: String, $publicArgument: String) {\n    logEvent(\n\t\tevent: $event\n\t\tuserCookieID: $userCookieID\n\t\turl: $url\n\t\tsource: $source\n\t\targument: $argument\n\t\tpublicArgument: $publicArgument\n    ) {\n\t\talwaysNil\n\t}\n}";
export declare const LOG_EVENT_MUTATION = "\nmutation LogEventMutation($event: String!, $userCookieID: String!, $url: String!, $source: EventSource!, $argument: String, $publicArgument: String, $client: String, $connectedSiteID: String, $hashedLicenseKey: String) {\n    logEvent(\n\t\tevent: $event\n\t\tuserCookieID: $userCookieID\n\t\turl: $url\n\t\tsource: $source\n\t\targument: $argument\n\t\tpublicArgument: $publicArgument\n\t\tclient: $client\n\t\tconnectedSiteID: $connectedSiteID\n\t\thashedLicenseKey: $hashedLicenseKey\n    ) {\n\t\talwaysNil\n\t}\n}";
export declare const RECORD_TELEMETRY_EVENTS_MUTATION = "\nmutation RecordTelemetryEvents($events: [TelemetryEventInput!]!) {\n\ttelemetry {\n\t\trecordEvents(events: $events) {\n\t\t\talwaysNil\n\t\t}\n\t}\n}\n";
export declare const CURRENT_SITE_IDENTIFICATION = "\nquery SiteIdentification {\n\tsite {\n\t\tsiteID\n\t\tproductSubscription {\n\t\t\tlicense {\n\t\t\t\thashedKey\n\t\t\t}\n\t\t}\n\t}\n}";
export declare const GET_FEATURE_FLAGS_QUERY = "\n    query FeatureFlags {\n        evaluatedFeatureFlags() {\n            name\n            value\n          }\n    }\n";
export declare const EVALUATE_FEATURE_FLAG_QUERY = "\n    query EvaluateFeatureFlag($flagName: String!) {\n        evaluateFeatureFlag(flagName: $flagName)\n    }\n";
//# sourceMappingURL=queries.d.ts.map