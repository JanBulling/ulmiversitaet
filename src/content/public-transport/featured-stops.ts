/** Stops shown by default in the public transport panel (SWU stop numbers) */
export const FEATURED_STOPS = [
  { name: "Uni Süd", stopId: 1240 },
  { name: "Bot. Garten", stopId: 1241 },
  { name: "Uni West", stopId: 1246 },
  { name: "Hbf", stopId: 1008 }
] as const;

export const DEFAULT_STOP = FEATURED_STOPS[0];
