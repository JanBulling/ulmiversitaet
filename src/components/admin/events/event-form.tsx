"use client";

import { Check } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useActionState } from "react";

import { DateInput } from "@/components/ui/date-input";
import { Input, Label } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { DEFAULT_EVENT_COLOR } from "@/features/events/format";
import type { Event } from "@/lib/db/schema";
import {
  saveEvent,
  type EventFormState,
} from "@/features/admin/events/actions";
import { EventColorField } from "./event-color-field";

/** Create (without `event`) or edit an event */
export function EventForm({ event }: { event?: Event }) {
  const t = useTranslations("Admin");
  const locale = useLocale();
  const [state, action] = useActionState<EventFormState, FormData>(
    saveEvent,
    {},
  );

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="id" value={event?.id ?? ""} />
      <input type="hidden" name="locale" value={locale} />

      <Field label={t("events.titleField")} htmlFor="title">
        <Input
          id="title"
          name="title"
          defaultValue={event?.title}
          required
          maxLength={200}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t("events.startDate")} htmlFor="startDate">
          <DateInput
            id="startDate"
            name="startDate"
            defaultValue={event?.startDate}
            required
          />
        </Field>
        <Field
          label={t("events.startTime")}
          htmlFor="startTime"
          hint={t("events.timeHint")}
        >
          <Input
            id="startTime"
            name="startTime"
            type="time"
            defaultValue={event?.startTime ?? ""}
          />
        </Field>
        <Field
          label={t("events.endDate")}
          htmlFor="endDate"
          hint={t("events.endDateHint")}
        >
          <DateInput
            id="endDate"
            name="endDate"
            defaultValue={
              event && event.endDate !== event.startDate ? event.endDate : ""
            }
          />
        </Field>
        <Field
          label={t("events.endTime")}
          htmlFor="endTime"
          hint={t("events.endTimeHint")}
        >
          <Input
            id="endTime"
            name="endTime"
            type="time"
            defaultValue={event?.endTime ?? ""}
          />
        </Field>
        <Field label={t("events.location")} htmlFor="location">
          <Input
            id="location"
            name="location"
            defaultValue={event?.location ?? ""}
            maxLength={200}
          />
        </Field>
        <EventColorField
          name="color"
          defaultValue={event?.color ?? DEFAULT_EVENT_COLOR}
        />
      </div>

      <Field label={t("events.description")} htmlFor="description">
        <textarea
          id="description"
          name="description"
          defaultValue={event?.description ?? ""}
          maxLength={2000}
          rows={3}
          className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 md:text-sm dark:bg-input/30"
        />
      </Field>

      <div className="flex items-center gap-3">
        <SubmitButton>
          {event ? t("categories.save") : t("events.create")}
        </SubmitButton>
        {state.saved && (
          <span className="flex items-center gap-1 text-sm text-success">
            <Check className="size-4" aria-hidden />
            {t("categories.saved")}
          </span>
        )}
        {state.error && (
          <span className="text-sm text-destructive">
            {state.error === "invalid"
              ? t("invalidInput")
              : t(`events.errors.${state.error}`)}
          </span>
        )}
      </div>
    </form>
  );
}

function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
