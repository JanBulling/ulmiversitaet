"use client";

import { Check } from "lucide-react";
import { useTranslations } from "next-intl";
import { useActionState, useState } from "react";

import { Input, Label, Select } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import type { CategoryGroup, CategoryKind } from "@/lib/db/schema";
import { CategoryIcon } from "@/components/mensa/icons";
import { CATEGORY_ICON_NAMES } from "@/features/mensa/category-icons";
import {
  updateGroup,
  type GroupFormState,
} from "@/features/admin/mensa-categories/actions";

const DEFAULT_COLOR = "#525252";
// Same values as the `category_kind` enum (not imported to keep Drizzle out of the client bundle)
const KINDS: CategoryKind[] = ["main", "side", "dessert", "other"];

/** Edit form for a display category, with a live preview of the label */
export function GroupForm({ group }: { group: CategoryGroup }) {
  const t = useTranslations("Admin");
  const [state, action] = useActionState<GroupFormState, FormData>(
    updateGroup,
    {},
  );
  const [preview, setPreview] = useState({
    name: group.nameDe,
    color: group.color ?? DEFAULT_COLOR,
    icon: group.icon ?? "utensils",
  });

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="id" value={group.id} />

      <div
        className="flex items-center gap-2 rounded-md border px-3 py-2"
        style={{ color: preview.color }}
        aria-hidden
      >
        <span className="font-mono font-bold uppercase">
          {preview.name || "–"}
        </span>
        <CategoryIcon icon={preview.icon} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t("categories.nameDe")} htmlFor="nameDe">
          <Input
            id="nameDe"
            name="nameDe"
            defaultValue={group.nameDe}
            required
            maxLength={100}
            onChange={(event) =>
              setPreview({ ...preview, name: event.target.value })
            }
          />
        </Field>
        <Field label={t("categories.nameEn")} htmlFor="nameEn">
          <Input
            id="nameEn"
            name="nameEn"
            defaultValue={group.nameEn ?? ""}
            maxLength={100}
          />
        </Field>
        <Field label={t("categories.color")} htmlFor="color">
          <Input
            id="color"
            name="color"
            type="color"
            defaultValue={group.color ?? DEFAULT_COLOR}
            className="h-9 cursor-pointer p-1"
            onChange={(event) =>
              setPreview({ ...preview, color: event.target.value })
            }
          />
        </Field>
        <Field label={t("categories.icon")} htmlFor="icon">
          <Select
            id="icon"
            name="icon"
            defaultValue={group.icon ?? "utensils"}
            onChange={(event) =>
              setPreview({ ...preview, icon: event.target.value })
            }
          >
            {CATEGORY_ICON_NAMES.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </Select>
        </Field>
        <Field
          label={t("categories.kind")}
          htmlFor="kind"
          hint={t("categories.kindHint")}
        >
          <Select id="kind" name="kind" defaultValue={group.kind}>
            {KINDS.map((kind) => (
              <option key={kind} value={kind}>
                {t(`categories.kinds.${kind}`)}
              </option>
            ))}
          </Select>
        </Field>
        <Field
          label={t("categories.showOnHome")}
          hint={t("categories.showOnHomeHint")}
        >
          <label className="flex h-9 items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="showOnHome"
              defaultChecked={group.showOnHome}
              className="size-4 accent-primary"
            />
            {t("categories.showOnHome")}
          </label>
        </Field>
      </div>

      <div className="flex items-center gap-3">
        <SubmitButton>{t("categories.save")}</SubmitButton>
        {state.saved && (
          <span className="flex items-center gap-1 text-sm text-success">
            <Check className="size-4" aria-hidden />
            {t("categories.saved")}
          </span>
        )}
        {state.error && (
          <span className="text-sm text-destructive">
            {state.error === "duplicateName"
              ? t("categories.duplicateName")
              : t("invalidInput")}
          </span>
        )}
      </div>
    </form>
  );
}

function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
