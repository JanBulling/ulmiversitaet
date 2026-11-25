import { getParkingSnapshot } from "@/features/parking/queries";

/**
 * Free parking spaces for the client-side refresh (the parking API itself is HTTP-only and
 * can't be called from the browser).
 */
export async function GET() {
  return Response.json(await getParkingSnapshot());
}
