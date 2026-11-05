import type { LinkCategory } from "../types";

export const studium: LinkCategory = {
  slug: "studium",
  title: { de: "Studium", en: "Studies" },
  description: { de: "Hier findest du Modulhandbücher, Bibliotheksverzeichnisse und Veranstaltungen.", en: "Here you can find module handbooks, library catalogs, and courses." },
  icon: "graduation-cap",
  links: [
    {
      id: "moodle",
      label: "Moodle",
      href: "https://moodle.uni-ulm.de/",
      keywords: ["kurse", "vorlesung", "lernplattform", "courses"],
    },
    {
      id: "campusonline",
      label: "CampusOnline",
      href: "https://campusonline.uni-ulm.de/",
      description: { de: "Das Portal Studium und Lehre (LSF) ist die zentrale Anlaufstelle für Prüfungsanmeldungen, Modulhandbücher und Veranstaltungsverzeichnisse.", en: "The portal for studies and teaching (LSF) is the central place for exam registration, module handbooks, and course catalogs." },
      keywords: ["lsf", "prüfungsanmeldung", "noten", "exam registration", "grades"],
      related: [
        { label: { de: "Veranstaltungsverzeichnis", en: "Course Catalog" }, href: "https://portal.uni-ulm.de/PortalWI/sso/vvz.html" },
        { label: { de: "Modulhandbücher", en: "Module Handbooks" }, href: "https://campusonline.uni-ulm.de/qislsf/rds?state=change&type=1&moduleParameter=modulhandbuecherMenue&nextdir=change&next=menu.vm&subdir=applications&xml=menu&purge=y&database=n&navigationPosition=modules%2CModulhandbuecher&breadcrumb=mod_handbuecher_UL&topitem=modules&subitem=Modulhandbuecher" },
        { label: { de: "Veranstaltungsarchiv", en: "Course Archive" }, href: "https://campusonline.uni-ulm.de/qislsf/rds?state=change&type=1&moduleParameter=VVZArchivMenue&nextdir=change&next=menu.vm&subdir=applications&xml=menu&purge=y&database=n&navigationPosition=lectures%2CVVZArchiv&topitem=lectures&subitem=VVZArchiv" },
      ],
    },
    {
      id: "campus4",
      label: "Campus4",
      href: "https://campus4.uni-ulm.de/",
      description: { de: "Hier gibt es alle möglichen Bescheinigungen.", en: "Here you can download all kinds of certificates." },
      keywords: ["immatrikulationsbescheinigung", "bescheinigung", "certificate", "enrollment"],
    },
    {
      id: "print-uni",
      label: "Print@Uni",
      href: "https://print.uni-ulm.de/",
      description: { de: "Drucken an den Geräten der Uni.", en: "Printing on the university's printers." },
      uniNetworkOnly: true,
      keywords: ["drucken", "printing", "drucker"],
    },
    {
      id: "cloudstore",
      label: "CloudStore",
      href: "https://cloudstore.uni-ulm.de/",
      keywords: ["nextcloud", "cloud", "dateien", "files"],
    },
    {
      id: "sogo",
      label: "SOGo",
      href: "https://sogo.uni-ulm.de/",
      description: { de: "Web-Mail und Kalender der Uni.", en: "Webmail and calendar of the university." },
    },
    {
      id: "bibliothekskatalog",
      label: { de: "Bibliothekskatalog", en: "Library Catalog" },
      href: "https://ulm.ibs-bw.de/",
      description: { de: "Hier findest du hoffentlich all deine Bücher!", en: "Hopefully you’ll find all your books here!" },
      keywords: ["bib", "bücher", "books", "kiz"],
      related: [
        { label: { de: "Buche einen Raum in der Bib", en: "Book a Room in the Library" }, href: "https://www.uni-ulm.de/einrichtungen/kiz/weiteres/formulare/reservierung-leseplatz-bibl-zentrale/" },
        { label: { de: "Öffnungszeiten", en: "Opening Hours" }, href: "https://www.uni-ulm.de/einrichtungen/kiz/home/service-points/service-point-ausleihe/" },
      ],
    },
    {
      id: "coronang",
      label: "CoronaNG",
      href: "https://campusonline.uni-ulm.de/CoronaNG/index.html",
      description: { de: "Anmeldungen für bestimmte Kurse (z.B. ASQ).", en: "Registration portal for certain courses (e.g. ASQ)." },
      related: [
        { label: { de: "Anleitung zur Anmeldung von ASQ", en: "Guide: ASQ Registration" }, href: "/guides/ASQ" },
      ],
    },
    {
      id: "hoersaalfinder",
      label: { de: "Hörsaalfinder", en: "Lecture Hall Finder" },
      href: "https://www.uni-ulm.de/einrichtungen/kiz/weiteres/campus-navigation/hoersaalfinder/",
      description: { de: "Finde dich auf dem Campus zurecht.", en: "Find your way around campus." },
      keywords: ["raum", "room", "karte", "map"],
    },
    {
      id: "exmatrikulation",
      label: { de: "Exmatrikulation", en: "Unenrollment" },
      href: "/exmatriculation",
      description: { de: "Soll ich mich exmatrikulieren? Und wie?", en: "Should I unenroll? And how?" },
    },
  ],
};
