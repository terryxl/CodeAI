import { type Configuration, type ConfigurationWithAccessToken } from "@sourcegraph/cody-shared";
import { CONFIG_KEY, type ConfigKeys } from "./configuration-keys";
interface ConfigGetter {
    get<T>(section: typeof CONFIG_KEY[ConfigKeys], defaultValue?: T): T;
}
/**
 * All configuration values, with some sanitization performed.
 */
export declare function getConfiguration(config?: ConfigGetter): Configuration;
export declare const getFullConfig: () => Promise<ConfigurationWithAccessToken>;
export {};
//# sourceMappingURL=configuration.d.ts.map