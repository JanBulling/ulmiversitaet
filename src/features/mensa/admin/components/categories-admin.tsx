import {
  ArrowDown,
  ArrowUp,
  House,
  Layers,
  Pencil,
  TriangleAlert,
  Tags,
} from "lucide-react";
import { getFormatter, getTranslations } from "next-intl/server";

import { AutoSubmitSelect } from "@/components/ui/auto-submit-select";
import { Button } from "@/components/ui/button";
import { Panel, PanelBody, PanelHeader } from "@/components/ui/panel";
import { Skeleton } from "@/components/ui/skeleton";
import { SubmitButton } from "@/components/ui/submit-button";
import { toDate } from "@/lib/date";
import { Link } from "@/lib/i18n/navigation";
import { CategoryLabel } from "../../components/category-label";
import { assignCategory, moveGroup, setShowOnHome } from "../actions";
import { getCategoryOverview } from "../queries";
import { CreateGroupForm } from "./create-group-form";

/** Raw menu categories with their group assignment, and the display categories */
export async function CategoriesAdmin() {
  const [t, format, { groups, categories }] = await Promise.all([
    getTranslations("Admin.categories"),
    getFormatter(),
    getCategoryOverview(),
  ]);

  return (
    <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
      <Panel>
        <PanelHeader icon={Tags} title={t("menuCategoriesTitle")}>
          {categories.length}
        </PanelHeader>
        <ul className="divide-y divide-accent">
          {categories.map((category) => (
            <li
              key={category.id}
              className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-2"
            >
              <div className="min-w-0">
                <p className="flex items-center gap-2 font-mono font-bold">
                  {category.groupId === null && (
                    <TriangleAlert
                      className="size-4 text-warning"
                      aria-label={t("unassigned")}
                    />
                  )}
                  {category.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t("servings", { count: category.servings })}
                  {category.lastSeen && (
                    <>
                      {" · "}
                      {t("lastSeen", {
                        date: format.dateTime(toDate(category.lastSeen), {
                          dateStyle: "medium",
                        }),
                      })}
                    </>
                  )}
                </p>
              </div>
              <form action={assignCategory} className="w-full sm:w-56">
                <input type="hidden" name="categoryId" value={category.id} />
                <AutoSubmitSelect
                  name="groupId"
                  defaultValue={category.groupId ?? ""}
                  aria-label={category.name}
                >
                  <option value="">— {t("unassigned")} —</option>
                  {groups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.nameDe}
                    </option>
                  ))}
                </AutoSubmitSelect>
              </form>
            </li>
          ))}
        </ul>
      </Panel>

      <Panel>
        <PanelHeader icon={Layers} title={t("groupsTitle")}>
          {groups.length}
        </PanelHeader>
        <ul className="divide-y divide-accent">
          {groups.map((group, index) => (
            <li key={group.id} className="flex items-center gap-2 px-4 py-2">
              <div className="flex flex-col">
                <MoveButton
                  id={group.id}
                  direction="up"
                  disabled={index === 0}
                  label={t("moveUp")}
                />
                <MoveButton
                  id={group.id}
                  direction="down"
                  disabled={index === groups.length - 1}
                  label={t("moveDown")}
                />
              </div>
              <div className="min-w-0 flex-1">
                <CategoryLabel category={group} />
                <p className="text-xs text-muted-foreground">
                  {group.nameEn ?? "–"} · {t(`kinds.${group.kind}`)}
                </p>
              </div>
              <form action={setShowOnHome}>
                <input type="hidden" name="id" value={group.id} />
                <input
                  type="hidden"
                  name="showOnHome"
                  value={String(!group.showOnHome)}
                />
                <SubmitButton
                  size="sm"
                  variant={group.showOnHome ? "default" : "outline"}
                  aria-pressed={group.showOnHome}
                  title={t("showOnHomeHint")}
                >
                  <House />
                  <span className="hidden sm:inline">{t("showOnHome")}</span>
                </SubmitButton>
              </form>
              <Button variant="ghost" size="icon" asChild>
                <Link
                  href={`/admin/mensa/categories/${group.id}`}
                  aria-label={t("edit")}
                >
                  <Pencil />
                </Link>
              </Button>
            </li>
          ))}
        </ul>
        <PanelBody className="mt-2 space-y-2 border-t pt-4">
          <p className="text-sm font-semibold">{t("newGroup")}</p>
          <CreateGroupForm />
        </PanelBody>
      </Panel>
    </div>
  );
}

export function CategoriesAdminSkeleton() {
  return (
    <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
      {[0, 1].map((i) => (
        <Panel key={i} className="space-y-3 px-4">
          <Skeleton className="h-8 w-56" />
          {Array.from({ length: 6 }, (_, row) => (
            <Skeleton key={row} className="h-10 w-full" />
          ))}
        </Panel>
      ))}
    </div>
  );
}

function MoveButton({
  id,
  direction,
  disabled,
  label,
}: {
  id: number;
  direction: "up" | "down";
  disabled: boolean;
  label: string;
}) {
  const Icon = direction === "up" ? ArrowUp : ArrowDown;
  return (
    <form action={moveGroup}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="direction" value={direction} />
      <SubmitButton
        variant="ghost"
        size="icon"
        className="size-6"
        disabled={disabled}
        aria-label={label}
      >
        <Icon className="size-3.5" />
      </SubmitButton>
    </form>
  );
}
