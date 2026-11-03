"use client";

import { useEffect } from "react";

/** Adds `.scrolled` to the header once the page is scrolled (translucent blur, see globals.css) */
export function HeaderScrollEffect({ targetId }: { targetId: string }) {
  useEffect(() => {
    const header = document.getElementById(targetId);
    const update = () =>
      header?.classList.toggle("scrolled", window.scrollY > 0);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, [targetId]);

  return null;
}
