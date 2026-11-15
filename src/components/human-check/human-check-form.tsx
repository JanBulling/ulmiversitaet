"use client";

import type {} from "altcha/types/react";
import { useLocale, useTranslations } from "next-intl";
import { useActionState, useEffect, useRef } from "react";

import {
  verifyHuman,
  type HumanCheckState,
} from "@/features/human-check/actions";

type Widget = HTMLElement & { reset?: () => void };

/**
 * ALTCHA checkbox: solves the proof-of-work in the browser, then submits on its own. The
 * Server Action verifies it and sets the cookie, which re-renders the page with its content.
 */
export function HumanCheckForm() {
  const t = useTranslations("HumanCheck");
  const locale = useLocale();
  const [state, action, pending] = useActionState<HumanCheckState, FormData>(
    verifyHuman,
    {},
  );
  const form = useRef<HTMLFormElement>(null);
  const widget = useRef<Widget>(null);

  useEffect(() => {
    // The web component only runs in the browser; English texts are built in
    void (async () => {
      if (locale === "de") await import("altcha/i18n/de");
      await import("altcha");
    })();
  }, [locale]);

  useEffect(() => {
    const element = widget.current;
    const submit = () => form.current?.requestSubmit();
    element?.addEventListener("verified", submit);
    return () => element?.removeEventListener("verified", submit);
  }, []);

  // A rejected solution (e.g. expired) can't be submitted again
  useEffect(() => {
    if (state.error) widget.current?.reset?.();
  }, [state]);

  return (
    <form ref={form} action={action} className="space-y-2">
      <altcha-widget
        ref={widget}
        challenge="/api/human-check"
        language={locale}
      />
      {pending && (
        <p className="text-sm text-muted-foreground">{t("loading")}</p>
      )}
      {state.error && !pending && (
        <p className="text-sm text-destructive">{t("failed")}</p>
      )}
    </form>
  );
}
