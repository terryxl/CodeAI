"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emptyDisposable = void 0;
const Disposable_1 = require("./Disposable");
exports.emptyDisposable = new Disposable_1.Disposable(() => { });
