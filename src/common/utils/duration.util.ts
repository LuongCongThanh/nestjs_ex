const UNIT_MS: Record<string, number> = {
  d: 24 * 60 * 60 * 1000,
  h: 60 * 60 * 1000,
  m: 60 * 1000,
  s: 1000,
};

export function parseDurationMs(duration: string, fallbackMs = 15 * 60 * 1000): number {
  const unit = duration.slice(-1);
  const value = Number.parseInt(duration.slice(0, -1), 10);
  return UNIT_MS[unit] != null && !Number.isNaN(value) ? value * UNIT_MS[unit] : fallbackMs;
}

export function addDuration(from: Date, duration: string, fallbackMs = 7 * 24 * 60 * 60 * 1000): Date {
  return new Date(from.getTime() + parseDurationMs(duration, fallbackMs));
}
