declare const properties: {
    "cody.serverEndpoint": {
        order: number;
        type: string;
        description: string;
        examples: string;
        markdownDeprecationMessage: string;
        deprecationMessage: string;
    };
    "cody.proxy": {
        type: string;
        markdownDeprecationMessage: string;
    };
    "cody.codebase": {
        order: number;
        type: string;
        markdownDescription: string;
        examples: string[];
    };
    "cody.useContext": {
        order: number;
        type: string;
        enum: string[];
        default: string;
        markdownDescription: string;
    };
    "cody.customHeaders": {
        order: number;
        type: string;
        markdownDescription: string;
        default: {};
        examples: {
            "Cache-Control": string;
            "Proxy-Authenticate": string;
        }[];
    };
    "cody.autocomplete.enabled": {
        order: number;
        type: string;
        markdownDescription: string;
        default: boolean;
    };
    "cody.autocomplete.languages": {
        order: number;
        type: string;
        markdownDescription: string;
        default: {
            "*": boolean;
        };
        examples: {
            "*": boolean;
            plaintext: boolean;
        }[];
    };
    "cody.editorTitleCommandIcon": {
        order: number;
        type: string;
        markdownDescription: string;
        default: boolean;
    };
    "cody.commandCodeLenses": {
        order: number;
        type: string;
        markdownDescription: string;
        default: boolean;
    };
    "cody.chat.preInstruction": {
        order: number;
        type: string;
        markdownDescription: string;
        examples: string[];
    };
    "cody.codeActions.enabled": {
        order: number;
        title: string;
        type: string;
        markdownDescription: string;
        default: boolean;
    };
    "cody.commandHints.enabled": {
        order: number;
        title: string;
        type: string;
        markdownDescription: string;
        default: boolean;
    };
    "cody.debug.enable": {
        order: number;
        type: string;
        markdownDescription: string;
    };
    "cody.debug.verbose": {
        order: number;
        type: string;
        markdownDescription: string;
    };
    "cody.debug.filter": {
        order: number;
        type: string;
        markdownDescription: string;
    };
    "cody.telemetry.level": {
        order: number;
        type: string;
        enum: string[];
        enumDescriptions: string[];
        markdownDescription: string;
        default: string;
    };
    "cody.autocomplete.advanced.provider": {
        type: string;
        default: any;
        enum: string[];
        markdownDescription: string;
    };
    "cody.autocomplete.advanced.serverEndpoint": {
        type: string;
        markdownDescription: string;
    };
    "cody.autocomplete.advanced.accessToken": {
        type: string;
        markdownDescription: string;
    };
    "cody.autocomplete.advanced.model": {
        type: string;
        default: any;
        enum: string[];
        markdownDescription: string;
    };
    "cody.autocomplete.completeSuggestWidgetSelection": {
        type: string;
        default: boolean;
        markdownDescription: string;
    };
    "cody.autocomplete.formatOnAccept": {
        type: string;
        default: boolean;
        markdownDescription: string;
    };
    "cody.autocomplete.disableInsideComments": {
        type: string;
        default: boolean;
        markdownDescription: string;
    };
    "cody.internal.unstable": {
        order: number;
        type: string;
        markdownDescription: string;
        default: boolean;
    };
    "cody.models.vender": {
        order: number;
        type: string;
        enum: string[];
        markdownDescription: string;
        default: string;
    };
};
export declare function defaultConfigurationValue(key: string): any;
export type ConfigurationKeysMap = {
    [key in keyof typeof properties as RemoveCodyPrefixAndCamelCase<key>]: key;
};
export declare function getConfigEnumValues(key: string): string[];
type RemoveCodyPrefixAndCamelCase<T extends string> = T extends `cody.${infer A}` ? A extends `${infer B}.${infer C}` ? `${B}${CamelCaseDotSeparatedFragments<C>}` : `${A}` : never;
type CamelCaseDotSeparatedFragments<T extends string> = T extends `${infer A}.${infer B}` ? `${Capitalize<A>}${CamelCaseDotSeparatedFragments<B>}` : `${Capitalize<T>}`;
/**
 * Automatically infer the configuration keys from the package.json in a type-safe way.
 * All the keys are mapped into the `CONFIG_KEY` object by removing the `cody.` prefix and
 * camelcasing the rest of the dot separated fragments.
 *
 * We should avoid specifiying config keys manually and instead rely on constant.
 * No manual changes will be required in this file when changing configuration keys in package.json.
 * TypeScript will error for all outdated/missing keys.
 */
export declare const CONFIG_KEY: ConfigurationKeysMap;
export type ConfigKeys = keyof typeof CONFIG_KEY;
export {};
//# sourceMappingURL=configuration-keys.d.ts.map