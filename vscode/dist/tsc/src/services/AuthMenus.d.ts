interface LoginMenuItem {
    id: string;
    label: string;
    description: string;
    totalSteps: number;
    uri: string;
}
type AuthMenuType = 'signin' | 'switch';
export declare const AuthMenu: (type: AuthMenuType, historyItems: string[]) => Promise<LoginMenuItem | null>;
/**
 * Show a VS Code input box to ask the user to enter a Sourcegraph instance URL.
 */
export declare function showInstanceURLInputBox(title: string): Promise<string | undefined>;
/**
 * Show a VS Code input box to ask the user to enter an access token.
 */
export declare function showAccessTokenInputBox(endpoint: string): Promise<string | undefined>;
export {};
//# sourceMappingURL=AuthMenus.d.ts.map