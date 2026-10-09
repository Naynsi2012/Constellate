export const SECOND = 1000;
export const MINUTE = 60 * SECOND;
export const HOUR = 60 * MINUTE;
export const DAY = 24 * HOUR;

const UNITS = {
  ms: 1,
  s: SECOND,
  m: MINUTE,
  h: HOUR,
  d: DAY,
};

export function parseDuration(value, fallbackMs) {
  if (value === undefined || value === null || value === "") return fallbackMs;

  const match = String(value).trim().toLowerCase().match(/^(\d+(?:\.\d+)?)\s*(ms|s|m|h|d)?$/);
  if (!match) {
    throw new Error(
      `Invalid duration "${value}". Use something like 30s, 5m, 2h or 3d.`,
    );
  }

  const ms = Number(match[1]) * UNITS[match[2] ?? "ms"];
  return ms > 0 ? ms : fallbackMs;
}

export const DEFAULT_ROOM_TTL = 3 * DAY;
export const DEFAULT_CLEANUP_INTERVAL = HOUR;
export const SAVE_DEBOUNCE_MS = 250;