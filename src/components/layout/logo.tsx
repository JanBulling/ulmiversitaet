import Image from "next/image";

import { Link } from "@/lib/i18n/navigation";
import { cn } from "@/lib/utils";

const SIZES = {
  sm: { logo: "size-8", big: "text-lg", text: "text-sm", px: 32 },
  md: { logo: "size-10", big: "text-xl", text: "text-base", px: 40 },
};

/** Logo + "Ulmiversität" wordmark, links to the home page */
export function Logo({
  size = "md",
  className,
}: {
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const s = SIZES[size];
  return (
    <Link
      href="/"
      className={cn("flex shrink-0 items-center gap-2", className)}
    >
      <Image
        src="/logo.png"
        alt=""
        width={s.px}
        height={s.px}
        className={cn("aspect-square dark:invert", s.logo)}
        priority
      />
      <span className={cn("font-semibold", s.text)}>
        <span className={cn("font-extrabold text-primary", s.big)}>Ulm</span>
        iversität
      </span>
    </Link>
  );
}
