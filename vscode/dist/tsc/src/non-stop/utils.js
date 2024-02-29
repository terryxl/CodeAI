"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMinimumDistanceToRangeBoundary = exports.isTerminalCodyTaskState = exports.CodyTaskState = void 0;
var CodyTaskState;
(function (CodyTaskState) {
    CodyTaskState[CodyTaskState["idle"] = 1] = "idle";
    CodyTaskState[CodyTaskState["working"] = 2] = "working";
    CodyTaskState[CodyTaskState["inserting"] = 3] = "inserting";
    CodyTaskState[CodyTaskState["applying"] = 4] = "applying";
    CodyTaskState[CodyTaskState["formatting"] = 5] = "formatting";
    CodyTaskState[CodyTaskState["applied"] = 6] = "applied";
    CodyTaskState[CodyTaskState["finished"] = 7] = "finished";
    CodyTaskState[CodyTaskState["error"] = 8] = "error";
    CodyTaskState[CodyTaskState["pending"] = 9] = "pending";
})(CodyTaskState || (exports.CodyTaskState = CodyTaskState = {}));
function isTerminalCodyTaskState(state) {
    switch (state) {
        case CodyTaskState.finished:
        case CodyTaskState.error:
            return true;
        default:
            return false;
    }
}
exports.isTerminalCodyTaskState = isTerminalCodyTaskState;
/**
 * Calculates the minimum distance from the given position to the start or end of the provided range.
 */
function getMinimumDistanceToRangeBoundary(position, range) {
    const startDistance = Math.abs(position.line - range.start.line);
    const endDistance = Math.abs(position.line - range.end.line);
    return Math.min(startDistance, endDistance);
}
exports.getMinimumDistanceToRangeBoundary = getMinimumDistanceToRangeBoundary;
