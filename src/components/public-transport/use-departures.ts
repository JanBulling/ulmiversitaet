"use client";

import { useEffect, useRef, useState } from "react";

import { getDepartures } from "@/features/public-transport/swu-api";
import type { Departure } from "@/features/public-transport/types";

const REFRESH_INTERVAL_MS = 15_000;

type State = {
  /** Stop the departures belong to; `null` before the first response */
  stopId: number | null;
  /** `null` if they couldn't be loaded */
  departures: Departure[] | null;
  failed: boolean;
};

/**
 * Departures of a stop, refreshed every 15 s directly from the SWU API (it allows cross-origin
 * requests) with a countdown that ticks every second. Loads right away when the stop changes;
 * until the new departures arrive, the previous ones are kept (`switching`).
 */
export function useDepartures(
  stopId: number,
  {
    limit,
    initial,
  }: {
    limit?: number;
    /** Rendered on the server, so the first stop doesn't need a request */
    initial?: { stopId: number; departures: Departure[] | null };
  } = {},
) {
  const [state, setState] = useState<State>(() =>
    initial
      ? { ...initial, failed: initial.departures === null }
      : { stopId: null, departures: null, failed: false },
  );
  // Stop of the shown departures, readable in the effect without re-running it every tick
  const loadedStopId = useRef(initial?.stopId ?? null);

  // Countdown every second, fresh data every 15 s (paused while the tab is hidden)
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const departures = await getDepartures(stopId, limit);
        if (cancelled) return;
        loadedStopId.current = stopId;
        setState({ stopId, departures, failed: false });
      } catch {
        if (cancelled) return;
        loadedStopId.current = stopId;
        // Keep showing this stop's last departures, but not those of another stop
        setState((current) =>
          current.stopId === stopId
            ? { ...current, failed: true }
            : { stopId, departures: null, failed: true },
        );
      }
    }

    if (loadedStopId.current !== stopId) void load();
    const tick = setInterval(() => {
      setState((current) => ({
        ...current,
        departures:
          current.departures?.map((departure) => ({
            ...departure,
            countdown: departure.countdown - 1,
          })) ?? null,
      }));
    }, 1000);
    const refresh = setInterval(() => {
      if (document.visibilityState === "visible") void load();
    }, REFRESH_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(tick);
      clearInterval(refresh);
    };
  }, [stopId, limit]);

  return {
    departures: state.departures,
    failed: state.failed,
    /** Waiting for the first response of this stop */
    loading: state.stopId !== stopId,
  };
}
