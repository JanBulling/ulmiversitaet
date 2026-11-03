import { CheckCircle } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { headers } from "next/headers";

import { detectUniNetwork } from "@/lib/network";
import { cn } from "@/lib/utils";

/** "Uni-VPN aktiv" / "eduroam® aktiv" badge (also referenced by the eduroam guides) */
export async function NetworkStatus({ className }: { className?: string }) {
  const network = detectUniNetwork((await headers()).get("x-forwarded-for"));
  if (!network) return null;

  const t = await getTranslations("Nav.network");
  return (
    <div
      className={cn(
        "flex w-fit items-center gap-1.5 rounded-md border bg-card px-2 py-1 text-xs font-bold text-success",
        className,
      )}
    >
      <CheckCircle className="size-4" aria-hidden />
      {t(network)}
    </div>
  );
}
