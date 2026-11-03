import "server-only";

import { timingSafeEqual } from "node:crypto";

import { env } from "@/lib/env";

/** Vercel sends `Authorization: Bearer <CRON_SECRET>` with every cron invocation */
export function isAuthorizedCronRequest(request: Request): boolean {
  const header = request.headers.get("authorization") ?? "";
  const expected = `Bearer ${env.CRON_SECRET}`;

  return (
    header.length === expected.length &&
    timingSafeEqual(Buffer.from(header), Buffer.from(expected))
  );
}
