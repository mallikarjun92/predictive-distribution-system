import { describe, it, expect } from 'vitest';
import { calculateJitterDelayMs, isWithinSendingWindow } from '../jitter.js';

describe('Jitter Delay & Sending Window', () => {
  it('should generate delays within the requested min and max bounds', () => {
    const minSec = 10;
    const maxSec = 20;
    for (let i = 0; i < 50; i++) {
      const delayMs = calculateJitterDelayMs(minSec, maxSec);
      expect(delayMs).toBeGreaterThanOrEqual(10000);
      expect(delayMs).toBeLessThanOrEqual(20000);
    }
  });

  it('should correctly detect if timestamp is inside sending window', () => {
    // Wednesday 10:30 UTC
    const wednesdayMorning = new Date('2026-10-28T10:30:00Z');
    const window = {
      days: [1, 2, 3, 4, 5], // Mon-Fri
      startTime: '09:00',
      endTime: '17:00',
    };
    expect(isWithinSendingWindow(wednesdayMorning, window)).toBe(true);

    // Wednesday 20:00 UTC (after hours)
    const wednesdayNight = new Date('2026-10-28T20:00:00Z');
    expect(isWithinSendingWindow(wednesdayNight, window)).toBe(false);

    // Sunday (day 0)
    const sunday = new Date('2026-10-25T11:00:00Z');
    expect(isWithinSendingWindow(sunday, window)).toBe(false);
  });
});
