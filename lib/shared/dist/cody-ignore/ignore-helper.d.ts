import { URI } from 'vscode-uri';
/**
 * The Cody ignore URI path.
 */
export declare const CODY_IGNORE_URI_PATH = ".cody/ignore";
/**
 * A glob matching the Cody ignore URI path.
 */
export declare const CODY_IGNORE_POSIX_GLOB = "**/.cody/ignore";
/**
 * A helper to efficiently check if a file should be ignored from a set
 * of nested ignore files.
 *
 * Callers must call `setIgnoreFiles` for each workspace root with the full set of ignore files (even
 * if there are zero) at startup (or when new workspace folders are added) and any time an ignore file
 * is modified/created/deleted.
 *
 * `clearIgnoreFiles` should be called for workspace roots as they are removed.
 */
export declare class IgnoreHelper {
    /**
     * A map of workspace roots to their ignore rules.
     */
    private workspaceIgnores;
    /**
     * Check if the configuration is enabled or not
     * Do not ignore files if the feature is not enabled
     * TODO: Remove this once it's ready for GA
     */
    private isActive;
    setActiveState(isActive: boolean): void;
    /**
     * Builds and caches a single ignore set for all nested ignore files within a workspace root.
     * @param workspaceRoot The workspace root.
     * @param ignoreFiles The URIs and content of all ignore files within the root.
     */
    setIgnoreFiles(workspaceRoot: URI, ignoreFiles: IgnoreFileContent[]): void;
    clearIgnoreFiles(workspaceRoot: URI): void;
    isIgnored(uri: URI): boolean;
    private findWorkspaceRoot;
    private ensureFileUri;
    private ensureAbsolute;
    private ensureValidCodyIgnoreFile;
    private getDefaultIgnores;
}
export interface IgnoreFileContent {
    uri: URI;
    content: string;
}
/**
 * Return the directory that a .cody/ignore file applies to.
 */
export declare function ignoreFileEffectiveDirectory(ignoreFile: URI): URI;
//# sourceMappingURL=ignore-helper.d.ts.map