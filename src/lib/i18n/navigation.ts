import { createNavigation } from "next-intl/navigation";

import { routing } from "./routing";

// Locale-aware wrappers — use these instead of `next/link` and `next/navigation`
export const { Link, getPathname, redirect, usePathname, useRouter } =
  createNavigation(routing);
