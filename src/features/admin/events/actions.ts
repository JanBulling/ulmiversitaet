"use server";

import { eq } from "drizzle-orm";
import { refresh, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth/session";
import { isIsoDate } from "@/lib/date";
import { db } from "@/lib/db";
import { events } from "@/lib/db/schema";
import { getPathname } from "@/lib/i18n/navigation";
import { routing } from "@/lib/i18n/routing";
import { EVENTS_CACHE_TAG } from "@/features/events/cache";

export type EventFormState = {
  error?: "invalid" | "endBeforeStart" | "endTimeWithoutStart";
  saved?: boolean;
};

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((value) => value || null);

const time = z
  .string()
  .regex(/^(\d{2}:\d{2})?$/)
  .transform((value) => value || null);

const eventSchema = z.object({
  id: z.union([z.literal(""), z.uuid()]),
  title: z.string().trim().min(1).max(200),
  description: optionalText(2000),
  location: optionalText(200),
  color: z.string().regex(/^#[0-9a-f]{6}$/i),
  startDate: z.string().refine(isIsoDate),
  // Empty = same day as the start
  endDate: z.union([z.literal(""), z.string().refine(isIsoDate)]),
  startTime: time,
  endTime: time,
  locale: z.enum(routing.locales).catch(routing.defaultLocale),
});

/** Creates (empty `id`) or updates an event */
export async function saveEvent(
  _previous: EventFormState,
  formData: FormData,
): Promise<EventFormState> {
  await requireAdmin();

  const parsed = eventSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "invalid" };
  const { id, locale, ...input } = parsed.data;

  const values = { ...input, endDate: input.endDate || input.startDate };
  if (values.endDate < values.startDate) return { error: "endBeforeStart" };
  if (values.endTime && !values.startTime)
    return { error: "endTimeWithoutStart" };
  if (
    values.startDate === values.endDate &&
    values.startTime &&
    values.endTime &&
    values.endTime < values.startTime
  ) {
    return { error: "endBeforeStart" };
  }

  if (id) {
    await db.update(events).set(values).where(eq(events.id, id));
  } else {
    await db.insert(events).values(values);
  }

  updateTag(EVENTS_CACHE_TAG);
  if (!id) redirect(getPathname({ href: "/admin/events", locale }));
  refresh();
  return { saved: true };
}

export async function deleteEvent(formData: FormData) {
  await requireAdmin();
  const { id, locale } = z
    .object({
      id: z.uuid(),
      locale: z.enum(routing.locales).catch(routing.defaultLocale),
    })
    .parse(Object.fromEntries(formData));

  await db.delete(events).where(eq(events.id, id));

  updateTag(EVENTS_CACHE_TAG);
  redirect(getPathname({ href: "/admin/events", locale }));
}
