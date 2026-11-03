import {
  DEFAULT_LINE_COLOR,
  LINE_ALIASES,
  LINE_COLORS,
  TRAM_LINES,
} from "@/content/public-transport/lines";

/** Badge style of a line (data in `src/content/public-transport/lines.ts`) */
export function routeStyle(route: string) {
  const name = LINE_ALIASES[route] ?? route;
  const color = LINE_COLORS[name] ?? DEFAULT_LINE_COLOR;
  return {
    name,
    color,
    shape: TRAM_LINES.includes(name)
      ? ("square" as const)
      : ("circle" as const),
    /** White badges get a black outline and black text */
    light: color.toUpperCase() === "#FFFFFF",
  };
}
