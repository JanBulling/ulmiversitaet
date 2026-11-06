"use client";

import { ChevronRight, LoaderCircle } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { askGuru } from "@/features/mensa/actions";
import type { GuruAdvice } from "@/features/mensa/guru-prompt";
import { Link } from "@/lib/i18n/navigation";
import { cn } from "@/lib/utils";

/** Same gradient and glow as on the previous site */
const GRADIENT =
  "bg-gradient-to-r from-cyan-400 via-sky-500 to-fuchsia-600 text-white shadow-[0_10px_30px_-10px_rgba(56,189,248,0.6)]";
const SMOKE_COLORS = ["#22d3ee", "#60a5fa", "#a78bfa", "#ec4899"];
const SMOKE_PARTICLES = 40;
/** The guru takes a moment even when the answer is cached, for the drama */
const MIN_THINKING_MS = 1000;
const TYPING_INTERVAL_MS = 10;

type Particle = {
  color: string;
  width: number;
  height: number;
  left: number;
  bottom: number;
  delay: number;
};

type State =
  | { status: "initial" }
  | { status: "thinking"; smoke: Particle[] }
  | { status: "answered"; advice: GuruAdvice }
  | { status: "failed" };

/** "Ask the guru" button below today's menu; the answer is typed out like a prophecy */
export function MensaGuru() {
  const t = useTranslations("Mensa");
  const locale = useLocale();
  const [state, setState] = useState<State>({ status: "initial" });

  async function ask() {
    setState({ status: "thinking", smoke: createSmoke() });
    const [result] = await Promise.all([
      askGuru(locale),
      new Promise((resolve) => setTimeout(resolve, MIN_THINKING_MS)),
    ]);
    setState(
      "advice" in result
        ? { status: "answered", advice: result.advice }
        : { status: "failed" },
    );
  }

  return (
    <div className="mt-4 flex justify-center px-4">
      {state.status === "initial" && (
        <button
          type="button"
          onClick={ask}
          className={cn(
            "relative max-w-sm cursor-pointer overflow-hidden rounded-full px-7 py-2.5 text-base",
            GRADIENT,
            "transition-transform duration-150 ease-out hover:scale-[1.02] active:scale-[0.99]",
            "focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none",
          )}
        >
          {/* Light sweeping across the button */}
          <span
            className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/25 to-transparent"
            aria-hidden
          />
          <span className="relative flex items-center gap-2 font-semibold tracking-wide">
            <SparklesIcon className="size-5" />
            {t("askGuru")}
          </span>
        </button>
      )}

      {state.status === "thinking" && (
        <div
          className="relative flex h-32 w-full items-center justify-center gap-2 overflow-x-clip"
          role="status"
        >
          <Smoke particles={state.smoke} />
          <span className="relative font-mono">{t("guruThinking")}</span>
          <LoaderCircle className="relative animate-spin" aria-hidden />
        </div>
      )}

      {state.status === "answered" && <Prophecy advice={state.advice} />}

      {state.status === "failed" && (
        <div className="w-full max-w-xl space-y-3 text-center" role="alert">
          <p className="rounded-xl border-2 border-destructive px-3 py-4 font-semibold text-destructive">
            {t("guruError")}
          </p>
          <button
            type="button"
            onClick={ask}
            className="text-sm font-semibold underline-offset-4 hover:underline"
          >
            {t("guruRetry")}
          </button>
        </div>
      )}
    </div>
  );
}

/** The answer, revealed character by character, then a link to the chosen meal */
function Prophecy({ advice }: { advice: GuruAdvice }) {
  const t = useTranslations("Mensa");
  const [shown, setShown] = useState(0);
  const typing = shown < advice.message.length;

  useEffect(() => {
    if (!typing) return;
    const timer = setTimeout(() => setShown(shown + 1), TYPING_INTERVAL_MS);
    return () => clearTimeout(timer);
  }, [shown, typing]);

  return (
    <div
      className={cn(
        "w-full max-w-xl rounded-2xl px-4 py-4 font-mono text-sm font-semibold",
        GRADIENT,
      )}
    >
      {/* Screen readers get the whole answer at once */}
      <p className="sr-only" aria-live="polite">
        {advice.message}
      </p>
      <p aria-hidden>
        {advice.message.slice(0, shown)}
        {typing && <span className="animate-pulse">▋</span>}
      </p>
      <Link
        href={`/mensa/meal/${advice.mealId}`}
        className={cn(
          "mt-3 inline-flex items-center gap-1 rounded-full bg-white/20 px-3 py-1 text-xs transition-opacity hover:bg-white/30",
          typing && "pointer-events-none opacity-0",
        )}
        tabIndex={typing ? -1 : undefined}
      >
        {t("guruToMeal")}
        <ChevronRight className="size-3.5" aria-hidden />
      </Link>
    </div>
  );
}

/** Colored smoke puffs rising while the guru thinks (positions are random per question) */
function Smoke({ particles }: { particles: Particle[] }) {
  return (
    // Clipped to the panel with soft edges, so the smoke doesn't drift over the next section
    <div
      className="absolute inset-0 overflow-hidden [mask-image:linear-gradient(to_bottom,transparent,black_25%,black_75%,transparent)]"
      aria-hidden
    >
      {particles.map((particle, index) => (
        <div
          key={index}
          className="absolute animate-smoke rounded-full blur-sm [animation-fill-mode:both]"
          style={{
            opacity: 0,
            backgroundImage: `radial-gradient(circle at 30% 30%, ${particle.color}99, transparent 60%)`,
            width: `${particle.width}%`,
            height: `${particle.height}%`,
            left: `${particle.left}%`,
            bottom: `${particle.bottom}%`,
            animationDelay: `${particle.delay}s`,
          }}
        />
      ))}
    </div>
  );
}

function createSmoke(): Particle[] {
  return Array.from({ length: SMOKE_PARTICLES }, (_, index) => ({
    color: SMOKE_COLORS[index % SMOKE_COLORS.length],
    width: Math.random() * 28 + 8,
    height: Math.random() * 28 + 8,
    left: Math.random() * 90 + 2,
    bottom: Math.random() * 45,
    delay: 0.1 * index - 0.03 * SMOKE_PARTICLES,
  }));
}

/** Three sparkles, the guru's sign (same icon as on the previous site) */
function SparklesIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <path d="M12 2l1.8 4.2L18 8l-4.2 1.8L12 14l-1.8-4.2L6 8l4.2-1.8L12 2zM6 14l1.2 2.8L10 18l-2.8 1.2L6 22l-1.2-2.8L2 18l2.8-1.2L6 14zm12-2l1 2.4L22 16l-3 1.2L18 20l-1.2-2.8L14 16l2.8-1.2L18 12z" />
    </svg>
  );
}
