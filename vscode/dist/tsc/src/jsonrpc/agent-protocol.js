"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.newTelemetryEvent = void 0;
/**
 * newTelemetryEvent is a constructor for TelemetryEvent that shares the same
 * type constraints as '(TelemetryEventRecorder).recordEvent()'.
 */
function newTelemetryEvent(feature, action, parameters) {
    return { feature, action, parameters };
}
exports.newTelemetryEvent = newTelemetryEvent;
