import {
  BookText,
  Code,
  CookingPot,
  ExternalLink,
  Heart,
  LinkIcon,
  MessageCircle,
  ShieldCheck,
  SquareParking,
  Target,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations } from "next-intl/server";

import { Page, PageHeader } from "@/components/layout/page";
import { GitHubIcon, InstagramIcon } from "@/components/layout/social-icons";
import { Button } from "@/components/ui/button";
import {
  Panel,
  PanelBody,
  PanelFooter,
  PanelHeader,
} from "@/components/ui/panel";
import { Tile } from "@/components/ui/tile";
import { siteConfig } from "@/lib/site";

/** Texts are in the `AboutPage.team.<key>` messages */
const TEAM: {
  key: "jan" | "stefan";
  name: string;
  image: string;
  roleIcon: LucideIcon;
  link: { href: string; label: string };
}[] = [
  {
    key: "jan",
    name: "Jan Bulling",
    image: "/img/jan.jpg",
    roleIcon: Code,
    link: { href: "https://jan-bulling.com", label: "jan-bulling.com" },
  },
  {
    key: "stefan",
    name: "Stefan Rau",
    image: "/img/stefan.jpg",
    roleIcon: ShieldCheck,
    link: {
      href: "https://www.instagram.com/rau__stefan/",
      label: "@rau__stefan",
    },
  },
];

/** What the site offers, linked from "Unser Ziel" */
const FEATURES: {
  key: "mensa" | "parking" | "links" | "guides";
  href: string;
  icon: LucideIcon;
}[] = [
  { key: "mensa", href: "/mensa", icon: CookingPot },
  { key: "parking", href: "/parking-lots", icon: SquareParking },
  { key: "links", href: "/links", icon: LinkIcon },
  { key: "guides", href: "/guides", icon: BookText },
];

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("AboutPage");
  return { title: t("title"), description: t("description") };
}

export default async function AboutPage() {
  const t = await getTranslations("AboutPage");

  return (
    <Page>
      <PageHeader
        icon={Users}
        title={t("title")}
        description={t("description")}
      />

      <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-2">
        {TEAM.map((person) => (
          <Panel key={person.key}>
            <PanelBody className="flex items-center gap-4">
              <Image
                src={person.image}
                alt=""
                width={160}
                height={160}
                className="size-16 shrink-0 rounded-full border object-cover md:size-20"
              />
              <div className="min-w-0">
                <h2 className="text-xl font-bold md:text-2xl">{person.name}</h2>
                <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <person.roleIcon className="size-4 shrink-0" aria-hidden />
                  {t(`team.${person.key}.role`)}
                </p>
              </div>
            </PanelBody>
            <PanelBody>
              <p className="mt-4 leading-relaxed">
                {t(`team.${person.key}.bio`)}
              </p>
              <Button variant="link" size="sm" className="mt-1 px-0" asChild>
                <a
                  href={person.link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {person.link.label}
                  <ExternalLink aria-hidden />
                </a>
              </Button>
            </PanelBody>
          </Panel>
        ))}
      </div>

      <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-7">
        <Panel className="md:col-span-4">
          <PanelHeader icon={Target} title={t("mission.title")} />
          <PanelBody className="space-y-4">
            <p className="leading-relaxed">{t("mission.text")}</p>
            <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {FEATURES.map((feature) => (
                <li key={feature.key}>
                  <Tile
                    href={feature.href}
                    icon={feature.icon}
                    title={t(`mission.features.${feature.key}.title`)}
                    description={t(
                      `mission.features.${feature.key}.description`,
                    )}
                    className="h-full"
                  />
                </li>
              ))}
            </ul>
          </PanelBody>
        </Panel>

        <div className="space-y-4 md:col-span-3">
          <Panel>
            <PanelHeader icon={ShieldCheck} title={t("independence.title")} />
            <PanelBody>
              <p className="leading-relaxed">
                {t.rich("independence.text", {
                  strong: (chunks) => <strong>{chunks}</strong>,
                })}
              </p>
            </PanelBody>
          </Panel>

          <Panel>
            <PanelHeader icon={MessageCircle} title={t("contact.title")} />
            <PanelBody>
              <p className="leading-relaxed">{t("contact.text")}</p>
            </PanelBody>
            <PanelFooter className="mt-4">
              <Button variant="outline" asChild>
                <a
                  href={siteConfig.links.github}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <GitHubIcon />
                  GitHub
                </a>
              </Button>
              <Button variant="outline" asChild>
                <a
                  href={siteConfig.links.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <InstagramIcon />
                  Instagram
                </a>
              </Button>
            </PanelFooter>
          </Panel>
        </div>
      </div>

      <p className="flex items-center justify-center gap-2 px-4 py-4 text-sm text-muted-foreground">
        <Heart className="size-4 shrink-0 text-primary" aria-hidden />
        {t("tagline")}
      </p>
    </Page>
  );
}
