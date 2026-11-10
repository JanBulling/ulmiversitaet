import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * The basic building block of every page: a flat card without radius or shadow.
 * Full-bleed with top/bottom border on mobile, bordered on all sides from `md`.
 * Children are not padded, so rows can span the full width; use `PanelBody` for text.
 */
export function Panel<T extends React.ElementType = "section">({
  as,
  className,
  ...props
}: { as?: T } & React.ComponentProps<T>) {
  const Component = as ?? "section";
  return (
    <Component
      data-slot="panel"
      className={cn("border-y bg-card py-4 md:border", className)}
      {...props}
    />
  );
}

/** Icon + title on the left, meta text or small actions on the right */
export function PanelHeader({
  icon: Icon,
  title,
  as: Heading = "h2",
  children,
  className,
}: {
  icon?: LucideIcon;
  title: React.ReactNode;
  as?: "h1" | "h2" | "h3";
  /** Right side: muted meta text and/or a small button */
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-2 flex items-center gap-4 px-4", className)}>
      {Icon && (
        <Icon className="size-6 shrink-0 text-primary md:size-8" aria-hidden />
      )}
      <Heading className="min-w-0 flex-1 text-xl font-bold md:text-2xl">
        {title}
      </Heading>
      {children && (
        <div className="flex shrink-0 items-center gap-4 text-sm text-muted-foreground">
          {children}
        </div>
      )}
    </div>
  );
}

export function PanelBody({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return <div className={cn("px-4", className)} {...props} />;
}

/** Centered actions at the end of a panel, e.g. an outline "more" button */
export function PanelFooter({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("mt-2 flex justify-center gap-2 px-4", className)}
      {...props}
    />
  );
}

export function PanelEmpty({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      className={cn(
        "my-8 px-4 text-center text-muted-foreground italic",
        className,
      )}
      {...props}
    />
  );
}
