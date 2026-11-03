import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { Button } from "@/components/ui/button";
import { Panel, PanelBody, PanelHeader } from "@/components/ui/panel";
import { Skeleton } from "@/components/ui/skeleton";
import { SubmitButton } from "@/components/ui/submit-button";
import { deleteGroup } from "@/features/mensa/admin/actions";
import { GroupForm } from "@/features/mensa/admin/components/group-form";
import { getCategoryGroup } from "@/features/mensa/admin/queries";
import { Link } from "@/lib/i18n/navigation";

type Props = PageProps<"/[locale]/admin/mensa/categories/[id]">;

export default async function EditGroupPage({ params }: Props) {
  const t = await getTranslations("Admin.categories");

  return (
    <>
      <div className="px-4 md:px-0">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/mensa/categories">
            <ArrowLeft />
            {t("back")}
          </Link>
        </Button>
      </div>
      <Suspense
        fallback={
          <Panel className="space-y-3 px-4">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-48 w-full" />
          </Panel>
        }
      >
        <EditGroup params={params} />
      </Suspense>
    </>
  );
}

async function EditGroup({ params }: { params: Props["params"] }) {
  const { id } = await params;
  const groupId = Number(id);
  const group = Number.isInteger(groupId)
    ? await getCategoryGroup(groupId)
    : null;
  if (!group) notFound();

  const [t, locale] = await Promise.all([
    getTranslations("Admin.categories"),
    getLocale(),
  ]);

  return (
    <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-7">
      <Panel className="md:col-span-4">
        <PanelHeader icon={Pencil} title={group.nameDe} as="h1" />
        <PanelBody>
          <GroupForm group={group} />
        </PanelBody>
      </Panel>

      <div className="space-y-4 md:col-span-3">
        <Panel>
          <PanelHeader title={t("assigned")} as="h2" />
          <PanelBody>
            {group.assigned.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {t("noneAssigned")}
              </p>
            ) : (
              <ul className="flex flex-wrap gap-1.5">
                {group.assigned.map((name) => (
                  <li
                    key={name}
                    className="rounded-full bg-muted px-2 py-0.5 font-mono text-xs font-medium"
                  >
                    {name}
                  </li>
                ))}
              </ul>
            )}
          </PanelBody>
        </Panel>

        <Panel>
          <PanelBody className="space-y-3">
            <p className="text-sm text-muted-foreground">{t("deleteHint")}</p>
            <form action={deleteGroup}>
              <input type="hidden" name="id" value={group.id} />
              <input type="hidden" name="locale" value={locale} />
              <SubmitButton variant="destructive" size="sm">
                <Trash2 />
                {t("delete")}
              </SubmitButton>
            </form>
          </PanelBody>
        </Panel>
      </div>
    </div>
  );
}
