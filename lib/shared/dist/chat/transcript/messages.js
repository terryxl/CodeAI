/**
 * Converts an Error to a ChatError. Note that this cannot be done naively,
 * because some of the Error object's keys are typically not enumerable, and so
 * would be omitted during serialization.
 */
export function errorToChatError(error) {
    return {
        isChatErrorGuard: 'isChatErrorGuard',
        ...error,
        message: error.message,
        name: error.name,
    };
}
//# sourceMappingURL=messages.js.map