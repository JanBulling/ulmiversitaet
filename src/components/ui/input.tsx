import { cn } from "@/lib/utils";

const fieldClasses =
  "flex h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive md:text-sm dark:bg-input/30";

function Input({ className, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      data-slot="input"
      className={cn(fieldClasses, className)}
      {...props}
    />
  );
}

/** Native select, styled like `Input` (works without JavaScript and inside Server Action forms) */
function Select({ className, ...props }: React.ComponentProps<"select">) {
  return (
    <select
      data-slot="select"
      className={cn(fieldClasses, "cursor-pointer pr-8", className)}
      {...props}
    />
  );
}

function Label({ className, ...props }: React.ComponentProps<"label">) {
  return (
    <label
      data-slot="label"
      className={cn("text-sm leading-none font-semibold", className)}
      {...props}
    />
  );
}

export { Input, Label, Select };
