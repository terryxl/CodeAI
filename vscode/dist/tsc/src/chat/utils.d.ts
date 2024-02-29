import { type AuthStatus } from './protocol';
/**
 * Checks a user's authentication status.
 * @param endpoint The server endpoint.
 * @param isDotComOrApp Whether the user is on an insider build instance or enterprise instance.
 * @param user Whether the user is logged in.
 * @param isEmailVerified Whether the user has verified their email. Default to true for non-enterprise instances.
 * @param isCodyEnabled Whether Cody is enabled on the Sourcegraph instance. Default to true for non-enterprise instances.
 * @param userCanUpgrade Whether the user can upgrade their plan.
 * @param version The Sourcegraph instance version.
 * @param avatarURL The user's avatar URL, or '' if not set.
 * @param username The user's username.
 * @param displayName The user's display name, or '' if not set.
 * @param primaryEmail The user's primary email, or '' if not set.
 * @returns The user's authentication status. It's for frontend to display when instance is on unsupported version if siteHasCodyEnabled is false
 */
export declare function newAuthStatus(endpoint: string, isDotComOrApp: boolean, user: boolean, isEmailVerified: boolean, isCodyEnabled: boolean, userCanUpgrade: boolean, version: string, avatarURL: string, username: string, displayName?: string, primaryEmail?: string, configOverwrites?: AuthStatus['configOverwrites']): AuthStatus;
/**
 * Counts the number of lines and characters in code blocks in a given string.
 * @param text - The string to search for code blocks.
 * @returns An object with the total lineCount and charCount of code in code blocks,
 * or null if no code blocks are found.
 */
export declare const countGeneratedCode: (text: string) => {
    lineCount: number;
    charCount: number;
} | null;
//# sourceMappingURL=utils.d.ts.map