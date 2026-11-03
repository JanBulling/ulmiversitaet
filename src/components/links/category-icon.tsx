import {
  Globe,
  GraduationCap,
  UserCog,
  Users,
  type LucideIcon,
} from "lucide-react";

import type { CategoryIconName } from "@/content/links";

const ICONS: Record<CategoryIconName, LucideIcon> = {
  "graduation-cap": GraduationCap,
  "user-cog": UserCog,
  users: Users,
  globe: Globe,
};

export function categoryIcon(name: CategoryIconName): LucideIcon {
  return ICONS[name];
}
