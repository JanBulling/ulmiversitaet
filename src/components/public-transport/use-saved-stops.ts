"use client";

import { useSyncExternalStore } from "react";

/** SWU stop numbers the user saved on the departures page, kept only in this browser */
const STORAGE_KEY = "saved-stops";

const NONE: number[] = [];
const listeners = new Set<() => void>();
let cache: { raw: string | null; stops: number[] } = { raw: null, stops: NONE };

function read(): number[] {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
  } catch {
    // Storage blocked (e.g. some private modes): nothing saved
  }
  // Same array for the same value, as `useSyncExternalStore` requires
  if (raw !== cache.raw) cache = { raw, stops: parse(raw) };
  return cache.stops;
}

function parse(raw: string | null): number[] {
  try {
    const value: unknown = JSON.parse(raw ?? "[]");
    return Array.isArray(value) ? value.filter(Number.isInteger) : NONE;
  } catch {
    return NONE;
  }
}

function write(stops: number[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stops));
  } catch {
    return;
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  // Changes in other tabs
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

/** Saved stops in the order they were saved; empty on the server */
export function useSavedStops() {
  const saved = useSyncExternalStore(subscribe, read, () => NONE);

  function toggle(stopId: number) {
    const current = read();
    write(
      current.includes(stopId)
        ? current.filter((id) => id !== stopId)
        : [...current, stopId],
    );
  }

  return { saved, toggle };
}
