/**
 * Calculates a randomized jitter delay in milliseconds.
 * E.g. min 180s, max 360s -> random duration between 180,000ms and 360,000ms.
 */
export declare function calculateJitterDelayMs(minSec: number, maxSec: number): number;
export interface SendingWindow {
    days: number[];
    startTime: string;
    endTime: string;
    timezone?: string;
}
/**
 * Checks if a given timestamp falls within the allowed sending window.
 */
export declare function isWithinSendingWindow(now: Date, window: SendingWindow): boolean;
//# sourceMappingURL=jitter.d.ts.map