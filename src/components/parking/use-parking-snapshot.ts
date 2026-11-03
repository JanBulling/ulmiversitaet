"use client";

import { useEffect, useState } from "react";

import type { ParkingSnapshot } from "@/features/parking/queries";

const REFRESH_INTERVAL_MS = 60_000;

/** Refreshes the parking data every minute via `/api/parking` (paused while the tab is hidden) */
export function useParkingSnapshot(
  initial: ParkingSnapshot,
  scope: "home" | "all",
) {
  const [snapshot, setSnapshot] = useState(initial);
  const [stale, setStale] = useState(false);

  useEffect(() => {
    const refresh = setInterval(async () => {
      if (document.visibilityState !== "visible") return;
      try {
        const response = await fetch(`/api/parking?scope=${scope}`, {
          cache: "no-store",
        });
        if (!response.ok) throw new Error(String(response.status));
        setSnapshot(await response.json());
        setStale(false);
      } catch {
        setStale(true);
      }
    }, REFRESH_INTERVAL_MS);
    return () => clearInterval(refresh);
  }, [scope]);

  return { snapshot, stale };
}
