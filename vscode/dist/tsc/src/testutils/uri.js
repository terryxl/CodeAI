"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Uri = void 0;
const vscode_uri_1 = require("vscode-uri");
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
class Uri {
    static parse(value, strict) {
        return new Uri(vscode_uri_1.URI.parse(value, strict));
    }
    static file(path) {
        return new Uri(vscode_uri_1.URI.file(path));
    }
    static joinPath(base, ...pathSegments) {
        return new Uri(vscode_uri_1.Utils.joinPath(base.uri ?? new Uri(base), ...pathSegments));
    }
    static from(components) {
        return new Uri(vscode_uri_1.URI.from(components));
    }
    uri;
    constructor(componentsOrUri) {
        if (componentsOrUri instanceof vscode_uri_1.URI) {
            this.uri = componentsOrUri;
        }
        else {
            this.uri = vscode_uri_1.URI.from(componentsOrUri);
        }
    }
    get scheme() {
        return this.uri.scheme;
    }
    get authority() {
        return this.uri.authority;
    }
    get path() {
        return this.uri.path;
    }
    get query() {
        return this.uri.query;
    }
    get fragment() {
        return this.uri.fragment;
    }
    get fsPath() {
        return this.uri.fsPath;
    }
    with(change) {
        return Uri.from({
            scheme: change.scheme || this.scheme,
            authority: change.authority || this.authority,
            path: change.path || this.path,
            query: change.query || this.query,
            fragment: change.fragment || this.fragment,
        });
    }
    toString(skipEncoding) {
        return this.uri.toString(skipEncoding);
    }
    toJSON() {
        return {
            scheme: this.scheme,
            authority: this.authority,
            path: this.path,
            query: this.query,
            fragment: this.fragment,
        };
    }
}
exports.Uri = Uri;
