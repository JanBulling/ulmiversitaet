import { BookText, CookingPot, House, Link, MapPinned } from "lucide-react";

/** Main navigation (desktop header, mobile tab bar); labels are keys in the `Nav` messages */
export const NAV_ITEMS = [
  { href: "/", label: "home", icon: House },
  { href: "/mensa", label: "mensa", icon: CookingPot },
  { href: "/campus-map", label: "map", icon: MapPinned },
  { href: "/links", label: "links", icon: Link },
  { href: "/guides", label: "guides", icon: BookText },
] as const;
