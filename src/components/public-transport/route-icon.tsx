import { routeStyle } from "@/features/public-transport/routes";
import { cn } from "@/lib/utils";

/** Line badge in SWU colors: square for trams, round for buses (same as on the previous site) */
export function RouteIcon({
  route,
  className,
}: {
  route: string;
  className?: string;
}) {
  const style = routeStyle(route);

  return (
    <span
      role="img"
      aria-label={style.name}
      className={cn(
        "flex size-7 shrink-0 items-center justify-center font-sans text-[15px] leading-none font-semibold tabular-nums",
        style.shape === "square" ? "rounded-none" : "rounded-full",
        style.light ? "border-2 border-black text-black" : "text-white",
        className,
      )}
      style={{ backgroundColor: style.color }}
    >
      {style.name}
    </span>
  );
}
