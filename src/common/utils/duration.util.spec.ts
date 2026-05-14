import { parseDurationMs, addDuration } from './duration.util';

describe('parseDurationMs', () => {
  it.each([
    ['7d', 7 * 24 * 60 * 60 * 1000],
    ['2h', 2 * 60 * 60 * 1000],
    ['15m', 15 * 60 * 1000],
    ['30s', 30 * 1000],
  ])('parses %s correctly', (input, expected) => {
    expect(parseDurationMs(input)).toBe(expected);
  });

  it('returns fallback for unknown unit', () => {
    expect(parseDurationMs('10x', 9999)).toBe(9999);
  });

  it('uses default 15m fallback when none provided', () => {
    expect(parseDurationMs('bad')).toBe(15 * 60 * 1000);
  });
});

describe('addDuration', () => {
  it('adds milliseconds to a date', () => {
    const base = new Date('2026-01-01T00:00:00Z');
    const result = addDuration(base, '1h');
    expect(result.getTime()).toBe(base.getTime() + 60 * 60 * 1000);
  });

  it('uses 7d fallback for unknown unit', () => {
    const base = new Date('2026-01-01T00:00:00Z');
    const result = addDuration(base, 'bad');
    expect(result.getTime()).toBe(base.getTime() + 7 * 24 * 60 * 60 * 1000);
  });
});
