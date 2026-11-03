import type { LinkCategory } from "../types";

export const international: LinkCategory = {
  slug: "international",
  title: "International Office",
  description: { de: "Links zum Auslandssemester / ERASMUS+ Programm.", en: "Links for semesters abroad / ERASMUS+ program." },
  icon: "globe",
  links: [
    {
      id: "international-office",
      label: "International Office",
      href: "https://www.uni-ulm.de/io/",
      description: { de: "Alle Informationen zum Auslandssemester-Programm.", en: "All information about the semester abroad program." },
      related: [
        { label: { de: "Erreichbar unter study-abroad(at)uni-ulm.de", en: "Reachable at study-abroad(at)uni-ulm.de" }, href: "mailto:study-abroad@uni-ulm.de" },
      ],
    },
    {
      id: "mobility-online",
      label: "Mobility-Online",
      href: "https://www.service4mobility.com/europe/LoginServlet",
    },
    {
      id: "erasmus-programm",
      label: { de: "ERASMUS+ Programm", en: "ERASMUS+ Program" },
      href: "https://www.uni-ulm.de/io/mob-out/ausland-semester-jahr/erasmus-sms/bewerbung-intern/",
      related: [
        { label: { de: "Suchportal für Partneruniversitäten", en: "Search portal for partner universities" }, href: "https://www.service4mobility.com/europe/PortalServlet?identifier=ULM01&showAll=0&showPartner=0&preselectTab=ver_nav_button&sprache=de" },
        { label: { de: "Sprachtests", en: "Language tests" }, href: "https://www.uni-ulm.de/department/home/studium-lehre/sprachtests/" },
        { label: { de: "Erfahrungsberichte", en: "Experience reports" }, href: "https://www.service4mobility.com/europe/PortalServlet?identifier=ULM01&showAll=0&showPartner=0&preselectTab=ver_nav_button&sprache=de" },
      ],
    },
  ],
};
