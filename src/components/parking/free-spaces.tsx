import { OCCUPANCY_COLORS, occupancyLevel } from "@/features/parking/occupancy";
import { cn } from "@/lib/utils";

/** Big number of free spaces in the occupancy color (green / amber / red) */
export function FreeSpaces({
  free,
  total,
  className,
}: {
  free: number | null;
  total: number;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "text-5xl font-extrabold tabular-nums",
        free === null && "text-muted-foreground",
        className,
      )}
      style={
        free === null
          ? undefined
          : { color: OCCUPANCY_COLORS[occupancyLevel(free, total)] }
      }
    >
      {free ?? "–"}
    </p>
  );
}
