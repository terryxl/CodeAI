"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestSupport = void 0;
// A one-slot channel which lets readers block on a value being
// available from a writer. Tests use this to wait for the
// extension to produce a value.
class Rendezvous {
    resolve;
    promise;
    constructor() {
        this.resolve = () => { };
        this.promise = new Promise(resolve => {
            this.resolve = resolve;
        });
    }
    set(value) {
        this.resolve(value);
        // FIXME: The extension constructs *two* ChatViewProviders.
        // Tests need to hang onto the second one, so we reset the
        // Promise here.
        // console.log('setting rendezvous value', new Error().stack)
        this.promise = Promise.resolve(value);
    }
    get() {
        return this.promise;
    }
}
// The interface to test hooks for the extension. If
// TestSupport.instance is set, the extension is running in an
// integration test.
class TestSupport {
    static instance;
    chatPanelProvider = new Rendezvous();
    ignoreHelper = new Rendezvous();
    async chatMessages() {
        return (await this.chatPanelProvider.get()).getViewTranscript();
    }
}
exports.TestSupport = TestSupport;
