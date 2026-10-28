"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateJitterDelayMs = calculateJitterDelayMs;
exports.isWithinSendingWindow = isWithinSendingWindow;
/**
 * Calculates a randomized jitter delay in milliseconds.
 * E.g. min 180s, max 360s -> random duration between 180,000ms and 360,000ms.
 */
function calculateJitterDelayMs(minSec, maxSec) {
    const safeMin = Math.max(1, minSec);
    const safeMax = Math.max(safeMin, maxSec);
    const randomizedSec = Math.floor(Math.random() * (safeMax - safeMin + 1)) + safeMin;
    return randomizedSec * 1000;
}
/**
 * Checks if a given timestamp falls within the allowed sending window.
 */
function isWithinSendingWindow(now, window) {
    const currentDay = now.getUTCDay();
    if (!window.days.includes(currentDay)) {
        return false;
    }
    const hours = String(now.getUTCHours()).padStart(2, '0');
    const minutes = String(now.getUTCMinutes()).padStart(2, '0');
    const currentTimeStr = `${hours}:${minutes}`;
    return currentTimeStr >= window.startTime && currentTimeStr <= window.endTime;
}
//# sourceMappingURL=jitter.js.map