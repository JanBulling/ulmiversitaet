import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { Button } from "@/components/ui/button";
import { Panel, PanelBody, PanelHeader } from "@/components/ui/panel";
import { Skeleton } from "@/components/ui/skeleton";
import { SubmitButton } from "@/components/ui/submit-button";
import { deleteEvent } from "@/features/events/admin/actions";
import { EventForm } from "@/features/events/admin/components/event-form";
import { getEvent } from "@/features/events/admin/queries";
import { Link } from "@/lib/i18n/navigation";

type Props = PageProps<"/[locale]/admin/events/[id]">;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function EditEventPage({ params }: Props) {
  const t = await getTranslations("Admin.events");

  return (
    <>
      <div className="px-4 md:px-0">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/events">
            <ArrowLeft />
            {t("back")}
          </Link>
        </Button>
      </div>
      <Suspense
        fallback={
          <Panel className="space-y-3 px-4">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-64 w-full" />
          </Panel>
        }
      >
        <EditEvent params={params} />
      </Suspense>
    </>
  );
}

async function EditEvent({ params }: { params: Props["params"] }) {
  const { id } = await params;
  const event = UUID.test(id) ? await getEvent(id) : null;
  if (!event) notFound();

  const [t, locale] = await Promise.all([
    getTranslations("Admin.events"),
    getLocale(),
  ]);

  return (
    <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-7">
      <Panel className="md:col-span-4">
        <PanelHeader icon={Pencil} title={event.title} as="h1" />
        <PanelBody>
          <EventForm event={event} />
        </PanelBody>
      </Panel>
      <Panel className="md:col-span-3">
        <PanelBody className="space-y-3">
          <p className="text-sm text-muted-foreground">{t("deleteHint")}</p>
          <form action={deleteEvent}>
            <input type="hidden" name="id" value={event.id} />
            <input type="hidden" name="locale" value={locale} />
            <SubmitButton variant="destructive" size="sm">
              <Trash2 />
              {t("delete")}
            </SubmitButton>
          </form>
        </PanelBody>
      </Panel>
    </div>
  );
}
