/**
 * Calculates a randomized jitter delay in milliseconds.
 * E.g. min 180s, max 360s -> random duration between 180,000ms and 360,000ms.
 */
export function calculateJitterDelayMs(minSec: number, maxSec: number): number {
  const safeMin = Math.max(1, minSec);
  const safeMax = Math.max(safeMin, maxSec);
  const randomizedSec = Math.floor(Math.random() * (safeMax - safeMin + 1)) + safeMin;
  return randomizedSec * 1000;
}

export interface SendingWindow {
  days: number[]; // 0 = Sun, 1 = Mon, ... 6 = Sat
  startTime: string; // "09:00"
  endTime: string; // "17:00"
  timezone?: string;
}

/**
 * Checks if a given timestamp falls within the allowed sending window.
 */
export function isWithinSendingWindow(now: Date, window: SendingWindow): boolean {
  const currentDay = now.getUTCDay();
  if (!window.days.includes(currentDay)) {
    return false;
  }

  const hours = String(now.getUTCHours()).padStart(2, '0');
  const minutes = String(now.getUTCMinutes()).padStart(2, '0');
  const currentTimeStr = `${hours}:${minutes}`;

  return currentTimeStr >= window.startTime && currentTimeStr <= window.endTime;
}
