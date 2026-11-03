import { routeStyle } from "@/features/public-transport/routes";
import { cn } from "@/lib/utils";

/** Line badge in SWU colors: square for trams, round for buses */
export function RouteIcon({
  route,
  className,
}: {
  route: string;
  className?: string;
}) {
  const style = routeStyle(route);
  const stroke = style.light ? "#000000" : "transparent";

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 40 40"
      className={cn("size-7 shrink-0", className)}
      role="img"
      aria-label={style.name}
    >
      {style.shape === "square" ? (
        <rect
          x="1"
          y="1"
          width="38"
          height="38"
          fill={style.color}
          stroke={stroke}
          strokeWidth="2"
        />
      ) : (
        <circle
          cx="20"
          cy="20"
          r="19"
          fill={style.color}
          stroke={stroke}
          strokeWidth="2"
        />
      )}
      <text
        x="50%"
        y="50%"
        fill={style.light ? "#000000" : "#FFFFFF"}
        fontSize={style.name.length > 2 ? 18 : 24}
        fontFamily="sans-serif"
        textAnchor="middle"
        dominantBaseline="central"
      >
        {style.name}
      </text>
    </svg>
  );
}
