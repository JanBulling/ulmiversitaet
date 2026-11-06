import { BUILDINGS } from "@/content/campus-map";

export type PreviewBuilding = {
  id: string;
  label: string;
  /** SVG path of the outline (all parts) */
  path: string;
  /** Label position */
  x: number;
  y: number;
};

export type CampusPreview = {
  width: number;
  height: number;
  buildings: PreviewBuilding[];
  /** SVG coordinates of a point */
  project: (lng: number, lat: number) => [number, number];
};

/**
 * Building outlines inside `bounds` (`[west, south, east, north]`) as SVG paths, `width` units
 * wide (north up, distances true to scale). Used for the static map on the home page.
 */
export function campusPreview(
  bounds: [number, number, number, number],
  width: number,
): CampusPreview {
  const [west, south, east, north] = bounds;
  // Longitude degrees are shorter than latitude degrees this far north
  const xScale = Math.cos((((south + north) / 2) * Math.PI) / 180);
  const scale = width / ((east - west) * xScale);
  const height = (north - south) * scale;
  const project = (lng: number, lat: number): [number, number] => [
    round((lng - west) * xScale * scale),
    round((north - lat) * scale),
  ];

  const buildings = BUILDINGS.features.flatMap(({ properties, geometry }) => {
    if (!geometry || !properties.center) return [];
    const polygons =
      geometry.type === "Polygon"
        ? [geometry.coordinates]
        : geometry.coordinates;
    const path = polygons
      .flat()
      .map(
        (ring) =>
          `M${ring.map(([lng, lat]) => project(lng, lat).join(",")).join("L")}Z`,
      )
      .join("");
    const [x, y] = project(...properties.center);
    const inside = x >= 0 && x <= width && y >= 0 && y <= height;
    return inside
      ? [{ id: properties.id, label: properties.label, path, x, y }]
      : [];
  });

  return { width, height: round(height), buildings, project };
}

function round(value: number): number {
  return Math.round(value * 10) / 10;
}
