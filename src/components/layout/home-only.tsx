"use client";

import { usePathname } from "@/lib/i18n/navigation";

/** Renders its children only on the home page (in any language) */
export function HomeOnly({ children }: { children: React.ReactNode }) {
  return usePathname() === "/" ? children : null;
}
