"use client";

import { useLocale, useTranslations } from "next-intl";
import { useActionState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input, Label } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { login, type LoginState } from "../actions";

export function LoginForm() {
  const t = useTranslations("Admin.login");
  const locale = useLocale();
  const [state, action] = useActionState<LoginState, FormData>(login, {});

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="locale" value={locale} />
      <div className="space-y-2">
        <Label htmlFor="username">{t("username")}</Label>
        <Input
          id="username"
          name="username"
          defaultValue={state.username}
          key={state.username}
          autoComplete="username"
          required
          autoFocus
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">{t("password")}</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </div>
      {state.error && (
        <Alert variant="destructive">
          <AlertDescription>{t("invalid")}</AlertDescription>
        </Alert>
      )}
      <SubmitButton className="w-full">{t("submit")}</SubmitButton>
    </form>
  );
}
