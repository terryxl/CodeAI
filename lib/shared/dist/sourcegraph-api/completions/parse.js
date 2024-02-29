import { isError } from '../../utils';
const EVENT_LINE_PREFIX = 'event: ';
const DATA_LINE_PREFIX = 'data: ';
const EVENTS_SEPARATOR = '\n\n';
function parseEventType(eventLine) {
    if (!eventLine.startsWith(EVENT_LINE_PREFIX)) {
        return new Error(`cannot parse event type: ${eventLine}`);
    }
    const eventType = eventLine.slice(EVENT_LINE_PREFIX.length);
    switch (eventType) {
        case 'completion':
        case 'error':
        case 'done':
            return eventType;
        default:
            return new Error(`unexpected event type: ${eventType}`);
    }
}
function parseJSON(data) {
    try {
        return JSON.parse(data);
    }
    catch {
        return new Error(`invalid JSON: ${data}`);
    }
}
function parseEventData(eventType, dataLine) {
    if (!dataLine.startsWith(DATA_LINE_PREFIX)) {
        return new Error(`cannot parse event data: ${dataLine}`);
    }
    const jsonData = dataLine.slice(DATA_LINE_PREFIX.length);
    switch (eventType) {
        case 'completion': {
            const data = parseJSON(jsonData);
            if (isError(data)) {
                return data;
            }
            if (typeof data.completion === 'undefined') {
                return new Error('invalid completion event');
            }
            return { type: eventType, completion: data.completion, stopReason: data.stopReason };
        }
        case 'error': {
            const data = parseJSON(jsonData);
            if (isError(data)) {
                return data;
            }
            if (typeof data.error === 'undefined') {
                return new Error('invalid error event');
            }
            return { type: eventType, error: data.error };
        }
        case 'done':
            return { type: eventType };
    }
}
function parseEvent(eventBuffer) {
    const [eventLine, dataLine] = eventBuffer.split('\n');
    const eventType = parseEventType(eventLine);
    if (isError(eventType)) {
        return eventType;
    }
    return parseEventData(eventType, dataLine);
}
export function parseEvents(eventsBuffer) {
    let eventStartIndex = 0;
    let eventEndIndex = eventsBuffer.indexOf(EVENTS_SEPARATOR);
    const events = [];
    while (eventEndIndex >= 0) {
        const event = parseEvent(eventsBuffer.slice(eventStartIndex, eventEndIndex));
        if (isError(event)) {
            return event;
        }
        events.push(event);
        eventStartIndex = eventEndIndex + EVENTS_SEPARATOR.length;
        eventEndIndex = eventsBuffer.indexOf(EVENTS_SEPARATOR, eventStartIndex);
    }
    return { events, remainingBuffer: eventsBuffer.slice(eventStartIndex) };
}
//# sourceMappingURL=parse.js.map