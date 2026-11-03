import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Page container. Content is full-bleed on mobile (panels draw their own borders)
 * and gets side padding from `md` on. See docs/design-guidelines.md.
 */
export function Page({
  width = "default",
  className,
  children,
}: {
  /** `narrow` for reading pages (guides) */
  width?: "default" | "narrow";
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "mx-auto my-4 w-full space-y-4 md:my-8 md:px-4",
        width === "narrow" ? "max-w-screen-lg" : "max-w-screen-xl",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Page title in the same style as a panel header, but as `h1` and outside a panel */
export function PageHeader({
  icon: Icon,
  title,
  description,
  actions,
  className,
}: {
  icon?: LucideIcon;
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Right-aligned, e.g. a small button */
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("px-4 md:px-0", className)}>
      <div className="flex items-center gap-4">
        {Icon && (
          <Icon
            className="size-6 shrink-0 text-primary md:size-8"
            aria-hidden
          />
        )}
        <h1 className="flex-1 text-2xl font-bold md:text-3xl">{title}</h1>
        {actions && (
          <div className="flex shrink-0 items-center gap-2">{actions}</div>
        )}
      </div>
      {description && (
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      )}
    </header>
  );
}
