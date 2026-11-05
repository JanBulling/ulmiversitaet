/**
 * Client for the live counters of the DUU parking system used by the university.
 * Only reachable via plain HTTP and without CORS, so it is called from the server only.
 */
const BASE_URL = "http://tsu-app.rrooaarr.biz/front/soap.php";
const TIMEOUT_MS = 5000;

export class ParkingApiError extends Error {
  name = "ParkingApiError";
}

/** Number of cars currently parked (can be negative, see `parseParkedCars`) */
export async function getParkedCars(counterId: number): Promise<number> {
  let response: Response;
  try {
    response = await fetch(`${BASE_URL}?counterid=${counterId}`, {
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (error) {
    throw new ParkingApiError(`Parking API not reachable: ${String(error)}`);
  }
  if (!response.ok)
    throw new ParkingApiError(`Parking API responded with ${response.status}`);
  return parseParkedCars(await response.text());
}

/**
 * The API answers with a bare number. Counters drift: when more cars leave than were counted
 * entering, they go negative (e.g. `-4` for a nearly empty lot), so negative values are real
 * readings, not errors. Unknown counters answer `-1` as well and can't be told apart.
 */
export function parseParkedCars(text: string): number {
  const trimmed = text.trim();
  const value = Number(trimmed);
  if (trimmed === "" || !Number.isInteger(value))
    throw new ParkingApiError(
      `Unexpected parking API response: "${text.slice(0, 50)}"`,
    );
  return value;
}
