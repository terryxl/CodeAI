/**
 *
 * This `Uri` class is a reimplemenation of `vscode.Uri` that is backed by
 * vscode-uri. The reason we reimplement `vscode.Uri` instead of using URI
 * directly in mocks is that we want full runtime fidelity with `vscode.Uri`. If
 * we use URI directly then we end up with minor runtime differences. For
 * example:
 *
 * - vscode.Uri.parse(..) instanceof URI // Should be false
 * - vscode.Uri.joinPath(..)             // Does not exist in URI
 *
 * We opened an issue about adding `joinPath` as a static function, which got
 * closed as wontfix https://github.com/microsoft/vscode/issues/194615
 *
 * We tried copy-pasting the full implementation of `vscode.Uri` into this
 * repository but it required adding >3k lines of code with minor that we have
 * to keep up-to-date and maintain. https://github.com/sourcegraph/cody/pull/1264

 * We tried using `Proxy` to avoid having to reimplement all APIs but this
 * solution didn't faithfully reproduce the behavior of `instanceof` checks.
 * https://github.com/sourcegraph/cody/pull/1335
 *
 * See agent/src/vscode-shim.test.ts for tests that assert that this class
 * is compatible with `vscode.Uri`.
 */
export declare class Uri {
    static parse(value: string, strict?: boolean): Uri;
    static file(path: string): Uri;
    static joinPath(base: Uri, ...pathSegments: string[]): Uri;
    static from(components: {
        readonly scheme: string;
        readonly authority?: string;
        readonly path?: string;
        readonly query?: string;
        readonly fragment?: string;
    }): Uri;
    private uri;
    private constructor();
    get scheme(): string;
    get authority(): string;
    get path(): string;
    get query(): string;
    get fragment(): string;
    get fsPath(): string;
    with(change: {
        scheme?: string;
        authority?: string;
        path?: string;
        query?: string;
        fragment?: string;
    }): Uri;
    toString(skipEncoding?: boolean): string;
    toJSON(): any;
}
//# sourceMappingURL=uri.d.ts.map