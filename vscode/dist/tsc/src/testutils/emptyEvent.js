"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emptyEvent = void 0;
const emptyDisposable_1 = require("./emptyDisposable");
function emptyEvent() {
    return () => emptyDisposable_1.emptyDisposable;
}
exports.emptyEvent = emptyEvent;
