import type { createFormatter } from "next-intl";

type Formatter = ReturnType<typeof createFormatter>;

/** Countdown to departure, e.g. "Jetzt", "45 s", "3 min", or the clock time if > 1 h */
export type CountdownLabel =
  | { kind: "departed" }
  | { kind: "now" }
  | { kind: "seconds"; value: number }
  | { kind: "minutes"; value: number }
  | { kind: "time"; value: string };

export function countdownLabel(
  countdown: number,
  actualTime: Date,
  format: Formatter,
): CountdownLabel {
  if (countdown <= -60) return { kind: "departed" };
  if (countdown <= 0) return { kind: "now" };
  if (countdown <= 60) return { kind: "seconds", value: countdown };
  if (countdown <= 3600)
    return { kind: "minutes", value: Math.ceil(countdown / 60) };
  return {
    kind: "time",
    value: format.dateTime(actualTime, { hour: "2-digit", minute: "2-digit" }),
  };
}

/** Delay below 10 s counts as on time */
const ON_TIME_TOLERANCE_SECONDS = 10;

/** -1 early, 0 on time, 1 delayed */
export function delayStatus(deviation: number): -1 | 0 | 1 {
  if (Math.abs(deviation) < ON_TIME_TOLERANCE_SECONDS) return 0;
  return deviation > 0 ? 1 : -1;
}

/** "+2min 20s", "-30s", or null when on time */
export function formatDelay(deviation: number): string | null {
  if (delayStatus(deviation) === 0) return null;
  const sign = deviation > 0 ? "+" : "-";
  const minutes = Math.floor(Math.abs(deviation) / 60);
  const seconds = Math.abs(deviation) % 60;
  return minutes > 0
    ? `${sign}${minutes}min ${seconds}s`
    : `${sign}${seconds}s`;
}
