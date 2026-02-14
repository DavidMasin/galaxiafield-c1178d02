/**
 * Frontend MUST NOT simulate match timing.
 *
 * The Raspberry Pi is authoritative and publishes `match.match_time_left`.
 * We keep this hook as a no-op so existing pages can import/call it without
 * accidentally starting any local intervals.
 */
export function useMatchTimer() {
  // Intentionally empty.
}
