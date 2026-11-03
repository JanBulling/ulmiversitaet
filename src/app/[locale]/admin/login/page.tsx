import { ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { Suspense } from "react";

import { Panel, PanelBody, PanelHeader } from "@/components/ui/panel";
import { LoginForm } from "@/components/admin/login-form";
import { isAdmin } from "@/lib/auth/session";
import { redirect } from "@/lib/i18n/navigation";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Admin.login");
  return { title: t("title") };
}

export default async function LoginPage() {
  const t = await getTranslations("Admin.login");

  return (
    <div className="mx-auto flex min-h-svh max-w-sm flex-col justify-center py-8">
      <Suspense>
        <RedirectIfLoggedIn />
      </Suspense>
      <Panel>
        <PanelHeader icon={ShieldCheck} title={t("title")} as="h1" />
        <PanelBody>
          <LoginForm />
        </PanelBody>
      </Panel>
    </div>
  );
}

async function RedirectIfLoggedIn() {
  if (await isAdmin()) redirect({ href: "/admin", locale: await getLocale() });
  return null;
}
