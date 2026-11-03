export type Departure = {
  route: string;
  direction: string;
  scheduledTime: Date;
  actualTime: Date;
  /** Seconds until departure at the time of the request */
  countdown: number;
  /** Delay in seconds (negative = early) */
  deviation: number;
};

export type PassengerAlert =
  | { status: "ok" }
  | { status: "disruption"; title: string | null; messages: string[] };

export type Stop = { stopId: number; name: string };
