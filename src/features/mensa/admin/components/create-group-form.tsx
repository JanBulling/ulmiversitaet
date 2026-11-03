"use client";

import { Plus } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useActionState } from "react";

import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { createGroup, type GroupFormState } from "../actions";

export function CreateGroupForm() {
  const t = useTranslations("Admin");
  const locale = useLocale();
  const [state, action] = useActionState<GroupFormState, FormData>(
    createGroup,
    {},
  );

  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="locale" value={locale} />
      <div className="flex gap-2">
        <Input
          name="nameDe"
          placeholder={t("categories.namePlaceholder")}
          aria-label={t("categories.newGroup")}
          required
          maxLength={100}
        />
        <SubmitButton variant="outline">
          <Plus />
          {t("categories.create")}
        </SubmitButton>
      </div>
      {state.error && (
        <p className="text-sm text-destructive">
          {state.error === "duplicateName"
            ? t("categories.duplicateName")
            : t("invalidInput")}
        </p>
      )}
    </form>
  );
}
