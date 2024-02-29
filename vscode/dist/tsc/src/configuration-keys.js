"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CONFIG_KEY = exports.getConfigEnumValues = exports.defaultConfigurationValue = void 0;
const lodash_1 = require("lodash");
const package_json_1 = __importDefault(require("../package.json"));
const { properties } = package_json_1.default.contributes.configuration;
function defaultConfigurationValue(key) {
    const value = properties[key]?.default;
    return value;
}
exports.defaultConfigurationValue = defaultConfigurationValue;
function getConfigFromPackageJson() {
    return Object.keys(properties).reduce((acc, key) => {
        // Remove the `cody.` prefix and camelCase the rest of the key.
        const keyProperty = (0, lodash_1.camelCase)(key.split('.').slice(1).join('.'));
        // This is just to hard to type correctly 😜 and it's doesn't make any difference.
        // @ts-ignore
        acc[keyProperty] = key;
        return acc;
    }, {});
}
function getConfigEnumValues(key) {
    const configKeys = properties[key];
    let enumValues = [];
    if ('enum' in configKeys) {
        enumValues = configKeys.enum;
    }
    return enumValues;
}
exports.getConfigEnumValues = getConfigEnumValues;
/**
 * Automatically infer the configuration keys from the package.json in a type-safe way.
 * All the keys are mapped into the `CONFIG_KEY` object by removing the `cody.` prefix and
 * camelcasing the rest of the dot separated fragments.
 *
 * We should avoid specifiying config keys manually and instead rely on constant.
 * No manual changes will be required in this file when changing configuration keys in package.json.
 * TypeScript will error for all outdated/missing keys.
 */
exports.CONFIG_KEY = getConfigFromPackageJson();
