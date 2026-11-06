import {
  BookOpen,
  Building2,
  CreditCard,
  Monitor,
  Presentation,
  Printer,
  SquareParking,
  TramFront,
  Users,
  Utensils,
  Wrench,
  type LucideIcon,
} from "lucide-react";

import type { CampusKind } from "@/features/campus-map/places";

export const KIND_ICONS: Record<CampusKind, LucideIcon> = {
  "lecture-hall": Presentation,
  "seminar-room": Users,
  "pc-pool": Monitor,
  printer: Printer,
  building: Building2,
  food: Utensils,
  library: BookOpen,
  service: Wrench,
  "top-up": CreditCard,
  stop: TramFront,
  parking: SquareParking,
};
