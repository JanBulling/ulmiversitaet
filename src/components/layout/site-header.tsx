import { Suspense } from "react";

import { HeaderScrollEffect } from "./header-scroll";
import { LocaleSwitcher, LocaleSwitcherFallback } from "./locale-switcher";
import { Logo } from "./logo";
import { MainNav, MainNavFallback } from "./main-nav";
import { ModeSwitcher } from "./mode-switcher";
import { NetworkStatus } from "./network-status";

const HEADER_ID = "site-header";

// Parts that read the URL or request headers sit behind Suspense, so every page keeps a static shell.
// On mobile the navigation is the tab bar at the bottom (`tab-bar.tsx`).
export function SiteHeader() {
  return (
    <header
      id={HEADER_ID}
      className="sticky top-0 z-40 w-full border-b bg-card transition-all duration-300 ease-in-out"
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-2 px-4">
        <Logo />

        <Suspense
          fallback={
            <MainNavFallback className="hidden md:flex md:flex-1 md:justify-center" />
          }
        >
          <MainNav className="hidden md:flex md:flex-1 md:justify-center" />
        </Suspense>

        <div className="ml-auto flex items-center gap-2 md:ml-0">
          <Suspense>
            <NetworkStatus className="hidden lg:flex" />
          </Suspense>
          <ModeSwitcher />
          <Suspense fallback={<LocaleSwitcherFallback />}>
            <LocaleSwitcher />
          </Suspense>
        </div>
      </div>
      <HeaderScrollEffect targetId={HEADER_ID} />
    </header>
  );
}
