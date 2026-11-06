import { ArrowRight, ChevronRight, type LucideIcon } from "lucide-react";

import { Link } from "@/lib/i18n/navigation";
import { cn } from "@/lib/utils";

/**
 * Link to another page, e.g. a guide or a folder. The only rounded "card" in the
 * design: `rounded-lg`, muted background, chevron on the right.
 */
export function Tile({
  href,
  external = false,
  prefetch,
  icon: Icon,
  iconClassName,
  title,
  description,
  meta,
  align = "center",
  size = "default",
  className,
}: {
  href: string;
  /** Opens in a new tab */
  external?: boolean;
  /** Load the whole page when the tile is visible, so it opens instantly (guides) */
  prefetch?: boolean;
  icon?: LucideIcon;
  /** Overrides the default small primary-colored icon */
  iconClassName?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Small muted line below the description, e.g. date and author */
  meta?: React.ReactNode;
  /** `top`: text starts at the top of a stretched tile (grids of equal-height tiles) */
  align?: "center" | "top";
  /** `lg`: taller, icon in a square badge and a larger title (folders) */
  size?: "default" | "lg";
  className?: string;
}) {
  const large = size === "lg";
  const icon = Icon && (
    <Icon
      className={cn(
        "shrink-0 text-primary",
        large ? "size-6" : "size-5",
        iconClassName,
      )}
      aria-hidden
    />
  );

  const content = (
    <div
      className={cn(
        "flex h-full items-center rounded-lg border bg-muted px-4 transition-colors duration-200 hover:bg-background",
        large ? "gap-4 py-4" : "gap-3 py-2",
      )}
    >
      {icon &&
        (large ? (
          <span className="flex size-12 shrink-0 items-center justify-center rounded-lg border bg-background">
            {icon}
          </span>
        ) : (
          icon
        ))}
      <div className={cn("min-w-0 flex-1", align === "top" && "self-stretch")}>
        <h3 className={cn("font-semibold", large && "text-lg")}>{title}</h3>
        {description && (
          <p className="line-clamp-2 text-sm text-muted-foreground">
            {description}
          </p>
        )}
        {meta && (
          <div className="mt-1 text-xs text-muted-foreground">{meta}</div>
        )}
      </div>
      <ChevronRight
        className="size-5 shrink-0 text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5"
        aria-hidden
      />
    </div>
  );

  return external ? (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn("group block", className)}
    >
      {content}
    </a>
  ) : (
    <Link
      href={href}
      prefetch={prefetch}
      className={cn("group block", className)}
    >
      {content}
    </Link>
  );
}

/** Dashed call-to-action tile ("Mehr Anleitungen") */
export function MoreTile({
  href,
  icon: Icon,
  title,
  className,
}: {
  href: string;
  icon?: LucideIcon;
  title: React.ReactNode;
  className?: string;
}) {
  return (
    <Link href={href} className={cn("group block", className)}>
      <div className="flex items-center gap-4 rounded-lg border-2 border-dashed border-primary px-4 py-4 text-primary hover:border-primary/50 hover:text-primary/50">
        {Icon && <Icon className="size-6" aria-hidden />}
        <h3 className="flex-1 font-semibold">{title}</h3>
        <ArrowRight
          className="size-5 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5"
          aria-hidden
        />
      </div>
    </Link>
  );
}
