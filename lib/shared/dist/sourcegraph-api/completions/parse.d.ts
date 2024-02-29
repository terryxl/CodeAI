import type { Event } from './types';
interface EventsParseResult {
    events: Event[];
    remainingBuffer: string;
}
export declare function parseEvents(eventsBuffer: string): EventsParseResult | Error;
export {};
//# sourceMappingURL=parse.d.ts.map