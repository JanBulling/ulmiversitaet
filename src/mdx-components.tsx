import type { MDXComponents } from "mdx/types";
import Image from "next/image";

import { StepWithImage, ThemeImage } from "@/components/mdx/theme-image";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Link } from "@/lib/i18n/navigation";
import { cn } from "@/lib/utils";

/**
 * Styles for markdown elements and the custom components available in guides.
 * Required by `@next/mdx`; applies to every `.md`/`.mdx` file.
 */
const components: MDXComponents = {
  h1: ({ className, ...props }) => (
    <h1
      className={cn(
        "mt-2 scroll-m-20 text-2xl font-bold md:text-3xl",
        className,
      )}
      {...props}
    />
  ),
  h2: ({ className, ...props }) => (
    <h2
      className={cn(
        "mt-10 scroll-m-20 text-xl font-bold first:mt-0 md:text-2xl",
        className,
      )}
      {...props}
    />
  ),
  h3: ({ className, ...props }) => (
    <h3
      className={cn("mt-8 scroll-m-20 text-lg font-semibold", className)}
      {...props}
    />
  ),
  h4: ({ className, ...props }) => (
    <h4
      className={cn("mt-6 scroll-m-20 font-semibold", className)}
      {...props}
    />
  ),
  a: ({ className, href = "", ...props }) => {
    const classes = cn("font-medium underline underline-offset-4", className);
    // Internal links stay in the current locale
    if (href.startsWith("/")) {
      return <Link href={href} className={classes} {...props} />;
    }
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={classes}
        {...props}
      />
    );
  },
  p: ({ className, ...props }) => (
    <p className={cn("leading-relaxed not-first:mt-6", className)} {...props} />
  ),
  strong: ({ className, ...props }) => (
    <strong className={cn("font-medium", className)} {...props} />
  ),
  ul: ({ className, ...props }) => (
    <ul className={cn("my-6 ml-6 list-disc", className)} {...props} />
  ),
  ol: ({ className, ...props }) => (
    <ol className={cn("my-6 ml-6 list-decimal", className)} {...props} />
  ),
  li: ({ className, ...props }) => (
    <li className={cn("mt-2", className)} {...props} />
  ),
  blockquote: ({ className, ...props }) => (
    <blockquote
      className={cn(
        "mt-6 border-l-2 pl-6 text-muted-foreground italic",
        className,
      )}
      {...props}
    />
  ),
  img: ({ className, alt, ...props }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img className={cn("rounded-lg", className)} alt={alt} {...props} />
  ),
  hr: (props) => <hr className="my-4 md:my-8" {...props} />,
  table: ({ className, ...props }) => (
    <div className="my-6 w-full overflow-y-auto">
      <table
        className={cn(
          "relative w-full overflow-hidden border-none text-sm",
          className,
        )}
        {...props}
      />
    </div>
  ),
  tr: ({ className, ...props }) => (
    <tr className={cn("m-0 border-b last:border-b-0", className)} {...props} />
  ),
  th: ({ className, ...props }) => (
    <th
      className={cn(
        "px-4 py-2 text-left font-bold [[align=center]]:text-center [[align=right]]:text-right",
        className,
      )}
      {...props}
    />
  ),
  td: ({ className, ...props }) => (
    <td
      className={cn(
        "px-4 py-2 text-left [[align=center]]:text-center [[align=right]]:text-right",
        className,
      )}
      {...props}
    />
  ),
  pre: ({ className, ...props }) => (
    <pre
      className={cn(
        "my-2 no-scrollbar min-w-0 overflow-x-auto rounded-md border bg-muted px-4 py-2 text-muted-foreground [&>code]:bg-transparent [&>code]:p-0",
        className,
      )}
      {...props}
    />
  ),
  code: ({ className, ...props }) => (
    <code
      className={cn(
        "rounded-sm bg-muted px-1 py-0.5 font-mono text-sm text-muted-foreground",
        className,
      )}
      {...props}
    />
  ),

  // Custom components usable in guides
  Image: ({ className, alt, ...props }: React.ComponentProps<typeof Image>) => (
    <Image
      className={cn("mt-6 rounded-lg border", className)}
      alt={alt}
      {...props}
    />
  ),
  Link: ({ className, ...props }: React.ComponentProps<typeof Link>) => (
    <Link
      className={cn("font-medium underline underline-offset-4", className)}
      {...props}
    />
  ),
  Button,
  Alert,
  AlertTitle,
  AlertDescription,
  ThemeImage,
  StepWithImage,
};

export function useMDXComponents(): MDXComponents {
  return components;
}
