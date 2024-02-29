"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.locationKeyFn = void 0;
/**
 * Returns a key unique to a given location for use with `dedupeWith`.
 */
const locationKeyFn = (location) => `${location.uri?.fsPath}?L${location.range.start.line}:${location.range.start.character}`;
exports.locationKeyFn = locationKeyFn;
