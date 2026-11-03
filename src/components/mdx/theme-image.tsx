import Image from "next/image";

import { cn } from "@/lib/utils";

type ThemeImageProps = {
  /** Path containing `/light/`; the dark variant is expected under `/dark/` */
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  inline?: boolean;
};

/**
 * Shows the `/light/` or `/dark/` variant of an image via CSS, so the correct one
 * is visible on first paint without waiting for the client-side theme.
 */
export function ThemeImage({
  src,
  alt,
  className,
  width = 300,
  height = 200,
  inline = false,
}: ThemeImageProps) {
  const classes = cn(
    "rounded-lg border",
    inline ? "mb-2 ml-4" : "mt-6",
    className,
  );
  const darkSrc = src.replace(/\/light\//, "/dark/");

  if (darkSrc === src) {
    return (
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={cn(classes, inline && "inline-block")}
      />
    );
  }

  return (
    <>
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={cn(
          classes,
          inline ? "inline-block dark:hidden" : "dark:hidden",
        )}
      />
      <Image
        src={darkSrc}
        alt={alt}
        width={width}
        height={height}
        className={cn(
          classes,
          inline ? "hidden dark:inline-block" : "hidden dark:block",
        )}
      />
    </>
  );
}

export function StepWithImage({
  children,
  className,
  ...image
}: ThemeImageProps & { children: React.ReactNode }) {
  return (
    <div
      className={cn(
        "mt-6 grid grid-cols-1 items-start gap-4 md:grid-cols-2",
        className,
      )}
    >
      <div>{children}</div>
      <div className="flex justify-center md:justify-end">
        <ThemeImage {...image} className="mt-0" />
      </div>
    </div>
  );
}
