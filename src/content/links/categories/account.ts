import type { LinkCategory } from "../types";

export const account: LinkCategory = {
  slug: "account",
  title: { de: "Account-Management", en: "Account Management" },
  description: { de: "Schnellzugriff auf deine Chipkarte, PC-Pools, Mailinglisten, SONA etc.", en: "Quick access to your chip card, PC pools, mailing lists, SONA, etc." },
  icon: "user-cog",
  links: [
    {
      id: "identitaetsmanagement",
      label: { de: "Identitätsmanagement", en: "Identity Management" },
      href: "https://portal.uni-ulm.de/idmFrontend/",
      description: { de: "Zentrale Verwaltung von Personendaten und Chipkarte.", en: "Central management of personal data and chip card." },
      keywords: ["idm", "passwort", "password", "chipkarte"],
      related: [
        { label: { de: "Mehr Informationen", en: "More information" }, href: "https://www.uni-ulm.de/einrichtungen/kiz/service-katalog/account-zugang/idm/" },
        { label: { de: "Chipkarte verlängern", en: "Extend chip card" }, href: "/guides/chipkarte" },
      ],
    },
    {
      id: "kiz-web-services",
      label: { de: "kiz Web-Services", en: "kiz Web Services" },
      href: "https://portal.uni-ulm.de/PortalWI/index.html",
      description: { de: "Eine Zusammenfassung aller Web-Services des kiz.", en: "An overview of all web services provided by kiz." },
    },
    {
      id: "sgi-account",
      label: { de: "SGI-Account", en: "SGI Account" },
      href: "https://www.uni-ulm.de/in/sgi/services/account-system/",
      description: { de: "Zugang zu PC-Pools der Informatik", en: "Access to the Computer Science PC pools" },
      related: [
        { label: { de: "Account beantragen", en: "Request an account" }, href: "https://www.informatik.uni-ulm.de/sgi-account/account-request" },
        { label: { de: "Passwort zurücksetzen", en: "Reset password" }, href: "https://www.informatik.uni-ulm.de/sgi-account/reset-password" },
      ],
    },
    {
      id: "mailing-listen",
      label: { de: "Mailing-Listen", en: "Mailing lists" },
      href: "https://imap.uni-ulm.de/lists",
      description: { de: "Ein- / Austragen aus Mailinglisten.", en: "Subscribe / unsubscribe from mailing lists." },
    },
    {
      id: "sona",
      label: "SONA",
      href: "https://uulm.sona-systems.com/",
      description: { de: "Verwaltung psychologischer Experimente und Management der Versuchspersonenstunden.", en: "Management of psychological experiments and research participation hours." },
      related: [
        { label: { de: "Passwort zurücksetzen", en: "Reset password" }, href: "https://uulm.sona-systems.com/lost_password.aspx" },
      ],
    },
  ],
};
