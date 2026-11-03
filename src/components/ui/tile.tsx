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
  icon: Icon,
  title,
  description,
  meta,
  className,
}: {
  href: string;
  /** Opens in a new tab */
  external?: boolean;
  icon?: LucideIcon;
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Small muted line below the description, e.g. date and author */
  meta?: React.ReactNode;
  className?: string;
}) {
  const content = (
    <div className="flex h-full items-center gap-3 rounded-lg border bg-muted px-4 py-2 transition-colors duration-200 hover:bg-background">
      {Icon && <Icon className="size-5 shrink-0 text-primary" aria-hidden />}
      <div className="min-w-0 flex-1">
        <h3 className="font-semibold">{title}</h3>
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
    <Link href={href} className={cn("group block", className)}>
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
