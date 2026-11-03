import type { Departure, PassengerAlert } from "./types";

/**
 * Client for the public mobility API of Stadtwerke Ulm (SWU). Works on the server and in the
 * browser (the API allows cross-origin requests). Data changes every 15 seconds.
 */
const BASE_URL = "https://api.swu.de/mobility/v1";
const TIMEOUT_MS = 5000;

export class SwuApiError extends Error {
  name = "SwuApiError";
}

/** GET a path of the SWU mobility API and return the parsed JSON */
export async function requestSwu(path: string): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (error) {
    throw new SwuApiError(`SWU API not reachable: ${String(error)}`);
  }
  if (!response.ok) {
    throw new SwuApiError(`SWU API responded with ${response.status}`);
  }
  return response.json();
}

export async function getDepartures(
  stopId: number,
  limit = 8,
): Promise<Departure[]> {
  return parseDepartures(
    await requestSwu(
      `/stop/passage/Departures?StopNumber=${stopId}&Limit=${limit}`,
    ),
  );
}

export async function getPassengerAlert(): Promise<PassengerAlert> {
  return parsePassengerAlert(
    await requestSwu("/passenger/alert/UnplannedAlert?ContentScope=minimal"),
  );
}

/* eslint-disable @typescript-eslint/no-explicit-any -- untyped API response */

export function parseDepartures(json: any): Departure[] {
  const passage = json?.StopPassage;
  if (!passage) throw new SwuApiError("Unexpected departures response");
  // Without upcoming departures the API omits `DepartureData`
  const data: any[] = Array.isArray(passage.DepartureData)
    ? passage.DepartureData
    : [];

  return data.map((item) => ({
    route: String(item.RouteName),
    direction: String(item.DepartureDirectionText),
    scheduledTime: new Date(item.DepartureTimeScheduled),
    actualTime: new Date(item.DepartureTimeActual),
    countdown: Number(item.DepartureCountdown),
    deviation: Number(item.DepartureDeviation),
  }));
}

export function parsePassengerAlert(json: any): PassengerAlert {
  const alert = json?.PassengerAlert;
  if (!alert) throw new SwuApiError("Unexpected alert response");

  // `CurrentStatus` can say "OK" while an alert text is present, so the text decides
  const text: string | undefined = alert.AlertData?.trim();
  if (!text) return { status: "ok" };

  return {
    status: "disruption",
    title: alert.AlertTitle ?? null,
    messages: text
      .split("+++")
      .map((message) => message.trim())
      .filter(Boolean),
  };
}
