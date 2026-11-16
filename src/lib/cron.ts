import "server-only";

import { timingSafeEqual } from "node:crypto";

import { env } from "@/lib/env";

/** Vercel Schedules (path targets) send `Authorization: Bearer <CRON_SECRET>` with every run */
export function isAuthorizedCronRequest(request: Request): boolean {
  const header = request.headers.get("authorization") ?? "";
  const expected = `Bearer ${env.CRON_SECRET}`;

  return (
    header.length === expected.length &&
    timingSafeEqual(Buffer.from(header), Buffer.from(expected))
  );
}
