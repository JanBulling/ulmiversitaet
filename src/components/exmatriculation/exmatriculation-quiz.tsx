"use client";

import { Check, ExternalLink, RotateCcw, Share2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { Button } from "@/components/ui/button";

/** Application form of the university, linked from the result */
const EXMATRICULATION_FORM_URL =
  "https://www.uni-ulm.de/fileadmin/website_uni_ulm/studium/Studienorganisation/Beurlaubung__Rueckmeldung_und_Exmatrikulation/Exmatrikulation/antrag_exmatrikulation_WEB.pdf";

/** `start` → question index → `result` */
type Step = "start" | number | "result";

/**
 * The (ironic) exmatriculation quiz: yes/no questions, ended by the first "no" or after the
 * last "yes". The answer is always the same.
 */
export function ExmatriculationQuiz() {
  const t = useTranslations("Exmatriculation");
  const questions = t.raw("questions") as string[];
  const [step, setStep] = useState<Step>("start");

  if (step === "start") {
    return (
      <div className="flex flex-col items-center gap-4 py-12 text-center">
        <p className="text-lg font-semibold">{t("startQuestion")}</p>
        <Button onClick={() => setStep(0)} className="w-full sm:w-auto">
          {t("start")}
        </Button>
      </div>
    );
  }

  if (step === "result") {
    return (
      <div className="space-y-8 py-8">
        <div className="flex flex-col items-center gap-2 text-center">
          <p className="text-muted-foreground">{t("recommendation")}</p>
          <p className="text-3xl font-extrabold uppercase md:text-5xl">
            {t("result")}
          </p>
        </div>
        <div className="flex flex-col items-center justify-center gap-2 sm:flex-row">
          <Button asChild>
            <a
              href={EXMATRICULATION_FORM_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              {t("form")}
              <ExternalLink aria-hidden />
            </a>
          </Button>
          <Button variant="outline" onClick={() => setStep("start")}>
            <RotateCcw aria-hidden />
            {t("restart")}
          </Button>
          <ShareButton />
        </div>
      </div>
    );
  }

  const last = step === questions.length - 1;

  return (
    <div className="space-y-6 py-4">
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">
          {t("progress", { current: step + 1, total: questions.length })}
        </p>
        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full bg-primary transition-[width] duration-300"
            style={{ width: `${((step + 1) / questions.length) * 100}%` }}
          />
        </div>
      </div>
      <p
        className="min-h-14 text-lg font-semibold md:text-xl"
        aria-live="polite"
      >
        {questions[step]}
      </p>
      <div className="flex gap-2">
        <Button
          className="flex-1 sm:flex-none"
          onClick={() => setStep(last ? "result" : step + 1)}
        >
          {t("yes")}
        </Button>
        <Button
          variant="outline"
          className="flex-1 sm:flex-none"
          onClick={() => setStep("result")}
        >
          {t("no")}
        </Button>
      </div>
    </div>
  );
}

/** Native share sheet where available, otherwise copies the link */
function ShareButton() {
  const t = useTranslations("Exmatriculation");
  const [status, setStatus] = useState<"shared" | "copied" | "failed">();

  async function share() {
    const data = {
      title: t("shareTitle"),
      text: t("shareText"),
      url: window.location.href,
    };
    try {
      if (navigator.share && navigator.canShare?.(data)) {
        await navigator.share(data);
        setStatus("shared");
      } else {
        await navigator.clipboard.writeText(data.url);
        setStatus("copied");
      }
    } catch (error) {
      // Closing the share sheet is not an error
      if (error instanceof DOMException && error.name === "AbortError") return;
      setStatus("failed");
    }
  }

  return (
    <Button variant="outline" onClick={share} disabled={!!status}>
      {status && status !== "failed" ? (
        <Check aria-hidden />
      ) : (
        <Share2 aria-hidden />
      )}
      {status ? t(`shareStatus.${status}`) : t("share")}
    </Button>
  );
}
