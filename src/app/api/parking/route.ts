import { getParkingSnapshot } from "@/features/parking/queries";

/**
 * Free parking spaces for the client-side refresh (the parking API itself is HTTP-only and
 * can't be called from the browser). `?scope=all` for all lots, otherwise the home page lots.
 */
export async function GET(request: Request) {
  const scope =
    new URL(request.url).searchParams.get("scope") === "all" ? "all" : "home";
  return Response.json(await getParkingSnapshot(scope));
}
