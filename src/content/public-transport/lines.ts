/**
 * SWU lines as shown in the line badges of the public transport panel.
 * See docs/public-transport.md for how to update this when SWU changes its network.
 *
 * Keys are the line *names* as they appear in departures (`RouteName`), e.g. "2", "13", "N5".
 * `pnpm update:transport` lists lines from the SWU API that are missing here.
 */

/** Badge color per line (official SWU colors, same values as on the previous site) */
export const LINE_COLORS: Record<string, string> = {
  "1": "#ED1B24",
  "2": "#37B355",
  "4": "#01806D",
  "5": "#1AA8BE",
  "6": "#F79534",
  "7": "#B1006A",
  "8": "#76408C",
  "9": "#DF9CBB",
  "10": "#A5A158",
  "11": "#005DA3",
  "12": "#B22C2B",
  "13": "#7AC4A5",
  "14": "#00ADEF",
  "15": "#B382BA",
  "16": "#DE4B95",
  "17": "#CC9900",
  E: "#FFFFFF",
  N1: "#E52129",
  N2: "#77418F",
  N3: "#82BC46",
  N4: "#1BB5EB",
  N5: "#085EA4",
  N6: "#057A4A",
  N7: "#DE4B95",
  N8: "#F39437",
};

/** Lines without an entry above (white badges get a black outline and text) */
export const DEFAULT_LINE_COLOR = "#FFFFFF";

/** Lines drawn as a square badge (trams); all other lines get a round badge (buses) */
export const TRAM_LINES = ["1", "2", "W", "F", "-"];

/** Line names that are displayed differently: `RouteName` → shown name */
export const LINE_ALIASES: Record<string, string> = {
  "101": "1", // line 1 operated by bus
  "102": "2", // line 2 operated by bus
  "201": "S", // depot run
  "202": "S", // driving school
  "19": "E",
};
