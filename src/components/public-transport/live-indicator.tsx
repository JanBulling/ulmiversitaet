import { Rss } from "lucide-react";

/** Pulsing "live" icon next to real-time data */
export function LiveIndicator({ label }: { label: string }) {
  return (
    <span className="relative flex size-4" title={label}>
      <span className="absolute inline-flex size-full animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite] rounded-full bg-primary opacity-50" />
      <Rss className="relative size-4 text-primary" aria-hidden />
    </span>
  );
}
