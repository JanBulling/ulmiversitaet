import { connection } from "next/server";

import { createHumanChallenge } from "@/features/human-check/human-check";

/** A fresh ALTCHA challenge for the human check widget (no database access) */
export async function GET() {
  await connection(); // a new random challenge per request, never prerendered
  return Response.json(await createHumanChallenge(), {
    headers: { "Cache-Control": "no-store" },
  });
}
