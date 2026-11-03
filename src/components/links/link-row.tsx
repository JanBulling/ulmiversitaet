import { ChevronRight, CornerDownRight, ExternalLink } from "lucide-react";
import { useTranslations } from "next-intl";

import type { ResolvedLink } from "@/features/links/links";
import { Link } from "@/lib/i18n/navigation";
import { cn } from "@/lib/utils";

/** Link inside a panel: label, description, hints, and related links below */
export function LinkRow({ link }: { link: ResolvedLink }) {
  const t = useTranslations("Links");

  return (
    <li className="py-1">
      <SmartLink
        href={link.href}
        className="group block px-4 py-2 hover:bg-muted"
      >
        <span className="flex items-center gap-2">
          <span className="font-semibold">{link.label}</span>
          {link.internal ? (
            <ChevronRight
              className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5"
              aria-hidden
            />
          ) : (
            <ExternalLink
              className="size-3.5 text-muted-foreground"
              aria-label={t("external")}
            />
          )}
          {link.uniNetworkOnly && (
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground group-hover:bg-background">
              {t("uniNetworkOnly")}
            </span>
          )}
        </span>
        {link.description && (
          <span className="mt-0.5 block text-sm text-muted-foreground">
            {link.description}
          </span>
        )}
      </SmartLink>

      {link.related.length > 0 && (
        <ul className="flex flex-wrap gap-x-4 gap-y-1 px-4 pb-2 pl-8 text-sm">
          {link.related.map((related) => (
            <li key={related.href + related.label}>
              <SmartLink
                href={related.href}
                className="inline-flex items-center gap-1 text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              >
                <CornerDownRight className="size-3.5" aria-hidden />
                {related.label}
              </SmartLink>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

/** Internal paths stay in the app (and the current language), everything else opens in a new tab */
function SmartLink({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
}) {
  if (href.startsWith("/")) {
    return (
      <Link href={href} className={className}>
        {children}
      </Link>
    );
  }
  const newTab = !href.startsWith("mailto:");
  return (
    <a
      href={href}
      className={cn(className)}
      {...(newTab && { target: "_blank", rel: "noopener noreferrer" })}
    >
      {children}
    </a>
  );
}
