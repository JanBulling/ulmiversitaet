/**
 * Parking lots of Ulm University and the university hospital with their live counters.
 * See docs/parking.md for how to add or change lots.
 *
 * `counterId`: counter of the DUU parking system (`null` = no live data, the lot is not shown).
 * `total`: number of spaces; free spaces = total − parked cars reported by the counter.
 */

export type ParkingArea = "WEST" | "KLINIKEN" | "OST" | "HELMHOLTZ" | "MICHELSBERG";

export type ParkingLot = {
  code: string;
  /** Full name; lots without a name are shown by their code */
  name?: string;
  /** Short name for small screens */
  shortName?: string;
  counterId: number | null;
  total: number;
  area: ParkingArea;
  address: string;
  lat: number;
  lng: number;
};

export const PARKING_LOTS: ParkingLot[] = [
  { code: "P09", name: "Manfred-Börner", shortName: "MBS", counterId: 10025, total: 64, area: "WEST", address: "Manfred-Börner-Straße, 89081 Ulm", lat: 48.41912, lng: 9.942359 },
  { code: "P10", name: "Uni West", shortName: "West", counterId: 10003, total: 301, area: "WEST", address: "Albert-Einstein-Allee 47, 89081 Ulm", lat: 48.42005, lng: 9.943917 },
  { code: "P11", counterId: 10004, total: 101, area: "WEST", address: "Albert-Einstein-Allee 45-47, 89081 Ulm", lat: 48.42046, lng: 9.94491 },
  { code: "P12", counterId: 10005, total: 66, area: "WEST", address: "Albert-Einstein-Allee 43-45, 89081 Ulm", lat: 48.42076, lng: 9.945848 },
  { code: "P13", counterId: 10006, total: 20, area: "WEST", address: "Albert-Einstein-Allee 37, 89081 Ulm", lat: 48.42076, lng: 9.945848 },
  { code: "P16", counterId: 10008, total: 174, area: "KLINIKEN", address: "Albert-Einstein-Allee 29, 89081 Ulm", lat: 48.42263, lng: 9.947908 },
  { code: "P20", name: "Parkhaus Mitte", shortName: "Mitte", counterId: 10020, total: 339, area: "KLINIKEN", address: "Albert-Einstein-Allee 16, 89081 Ulm", lat: 48.42396, lng: 9.951033 },
  { code: "P26", counterId: 10018, total: 107, area: "KLINIKEN", address: "Albert-Einstein-Allee 23, 89081 Ulm", lat: 48.42389, lng: 9.951642 },
  { code: "P23", name: "Externer Parkplatz", counterId: 10011, total: 413, area: "OST", address: "Albert-Einstein-Allee 8/2, 89081 Ulm", lat: 48.42543, lng: 9.95496 },
  { code: "P24", name: "Uni Nord", shortName: "Nord", counterId: 10012, total: 221, area: "OST", address: "Albert-Einstein-Allee, 89081 Ulm", lat: 48.42481, lng: 9.953938 },
  { code: "P41", name: "Helmholtz", shortName: "Helmh.", counterId: 10016, total: 481, area: "HELMHOLTZ", address: "Helmholtzstraße, 89081 Ulm", lat: 48.42599, lng: 9.958382 },
  { code: "P44", counterId: 10017, total: 78, area: "HELMHOLTZ", address: "Helmholtzstraße 14-22, 89081 Ulm", lat: 48.42602, lng: 9.96258 },
  // M1 and M2 share one counter in the DUU system (same number and total)
  { code: "M1", name: "HNO Klinik", counterId: 10021, total: 545, area: "MICHELSBERG", address: "Innenhof, Zufahrt über Eythstraße, 89081 Ulm", lat: 48.40938, lng: 9.991174 },
  { code: "M2", name: "Klinik Michelsberg", counterId: 10021, total: 545, area: "MICHELSBERG", address: "Schwabstraße 15, 89081 Ulm", lat: 48.40819, lng: 9.992269 },
  { code: "M3", name: "Frauenklinik", counterId: null, total: 83, area: "MICHELSBERG", address: "Pritwitzstrasse 43, 89081 Ulm", lat: 48.41076, lng: 9.99374 },
  { code: "M4", name: "Urologische Klinik", counterId: null, total: 20, area: "MICHELSBERG", address: "Pritwitzstrasse 43, 89081 Ulm", lat: 48.40974, lng: 9.994923 },
];

/** Lots on the home page, in this order */
export const HOME_LOTS = ["P10", "P24", "P41", "P09", "P20"];

/** Subset of `HOME_LOTS` shown on small screens */
export const HOME_LOTS_MOBILE = ["P10", "P24", "P41"];

/** Order of the areas on the parking page */
export const PARKING_AREAS: ParkingArea[] = ["WEST", "KLINIKEN", "OST", "HELMHOLTZ", "MICHELSBERG"];

/** Website of the parking system the live data comes from */
export const PARKING_SOURCE_URL = "http://tsu-app.rrooaarr.biz/front/mitarbeiter.html";
