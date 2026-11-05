import type { LinkCategory } from "../types";

export const stuve: LinkCategory = {
  slug: "stuve",
  title: { de: "StuVe-Services", en: "StuVe Services" },
  description: { de: "Links zur StuVe-Dienstleistungen.", en: "Links to StuVe services." },
  icon: "users",
  links: [
    {
      id: "stuve-website",
      label: { de: "StuVe-Website", en: "StuVe Website" },
      href: "https://stuve.de/",
      description: { de: "Die zentrale Website der StuVe (Studierendenvertretung).", en: "The central website of StuVe (student representation)." },
      related: [
        { label: { de: "Fachbereichsvertretungen", en: "Student councils" }, href: "https://stuve.de/fachbereichsvertretungen" },
        { label: { de: "StuVe Accountanfrage", en: "StuVe IT account request" }, href: "https://account.stuve.de/" },
      ],
    },
    {
      id: "aktuelle-veranstaltungen",
      label: { de: "Aktuelle Veranstaltungen", en: "Current events" },
      href: "https://stuve.de/veranstaltungsreferat/",
    },
    {
      id: "stuve-pad",
      label: { de: "StuVe-Pad", en: "StuVe Pad" },
      href: "https://pad.stuve.de/",
      description: { de: "HedgeDoc-Pad für gemeinsames Arbeiten an Dokumenten.", en: "HedgeDoc pad for collaborative editing." },
    },
    {
      id: "stuve-wiki",
      label: { de: "StuVe-Wiki", en: "StuVe Wiki" },
      href: "https://wiki.stuve.de/de/home",
    },
    {
      id: "stuve-it-tools",
      label: { de: "StuVe-IT Tools", en: "StuVe IT Tools" },
      href: "https://it.stuve.de/",
    },
    {
      id: "stuve-druck-service",
      label: { de: "StuVe-Druck-Service", en: "StuVe print service" },
      href: "https://druck.stuve.de/",
      description: { de: "Abrechnungsdienst für Druckaufträge der StuVe.", en: "Billing service for StuVe print jobs." },
    },
    {
      id: "typo3",
      label: "TYPO3",
      href: "https://stuve.de/typo3/",
      description: { de: "Tool zur Verwaltung der StuVe-Websites.", en: "Tool for managing StuVe websites." },
    },
  ],
};
