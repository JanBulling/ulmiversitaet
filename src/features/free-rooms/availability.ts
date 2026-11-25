/**
 * Whether a room is free at a given time of day, from its bookings of that day. Pure, so the
 * page can switch times in the browser without asking the server again.
 * Times are `HH:MM` strings (zero-padded, so they compare correctly as strings).
 */

export type Slot = {
  start: string;
  /** Exclusive: the room is free again at this time */
  end: string;
  title: string;
};

export type RoomStatus =
  | {
      free: true;
      /** Start of the next booking, `null` if there is none that day */
      until: string | null;
      /** Title of the next booking */
      next: string | null;
    }
  | {
      free: false;
      /** End of the booking, or of the bookings that follow it without a gap */
      until: string;
      title: string;
    };

export function roomStatus(slots: Slot[], time: string): RoomStatus {
  const current = slots.find((slot) => slot.start <= time && time < slot.end);
  if (current) {
    let until = current.end;
    // Follow back-to-back and overlapping bookings until there is a gap
    for (let extended = true; extended;) {
      extended = false;
      for (const slot of slots) {
        if (slot.start <= until && slot.end > until) {
          until = slot.end;
          extended = true;
        }
      }
    }
    return { free: false, until, title: current.title };
  }

  const next = slots
    .filter((slot) => slot.start > time)
    .reduce<Slot | null>(
      (first, slot) => (!first || slot.start < first.start ? slot : first),
      null,
    );
  return { free: true, until: next?.start ?? null, next: next?.title ?? null };
}

/** Minutes a free room stays free from `time` (`Infinity` without a later booking) */
export function freeMinutes(status: RoomStatus, time: string): number {
  if (!status.free) return 0;
  return status.until === null
    ? Infinity
    : minutes(status.until) - minutes(time);
}

/** `"08:30"` → `510` */
export function minutes(time: string): number {
  const [hours, mins] = time.split(":").map(Number);
  return hours * 60 + mins;
}

/** `510` → `"08:30"` */
export function timeFromMinutes(value: number): string {
  const hours = Math.floor(value / 60);
  return `${String(hours).padStart(2, "0")}:${String(value % 60).padStart(2, "0")}`;
}
