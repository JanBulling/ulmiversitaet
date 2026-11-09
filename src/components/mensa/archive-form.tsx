"use client";

import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { useId, useState } from "react";

import { Button } from "@/components/ui/button";
import { DateInput } from "@/components/ui/date-input";
import { Label } from "@/components/ui/input";
import { isIsoDate, isWeekend, type IsoDate } from "@/lib/date";
import { useRouter } from "@/lib/i18n/navigation";

/** Date picker that opens the menu page of the chosen day (`/mensa/YYYY-MM-DD`) */
export function ArchiveForm({
  first,
  last,
  initial,
}: {
  first: IsoDate;
  last: IsoDate;
  initial: IsoDate;
}) {
  const t = useTranslations("MensaArchive");
  const router = useRouter();
  const [date, setDate] = useState(initial);
  const id = useId();
  const valid = isIsoDate(date);

  return (
    <form
      className="flex flex-wrap items-end gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        if (valid) router.push(`/mensa/${date}`);
      }}
    >
      <div className="space-y-2">
        <Label htmlFor={id}>{t("date")}</Label>
        <DateInput
          id={id}
          defaultValue={initial}
          min={first}
          max={last}
          onValueChange={setDate}
          required
          className="w-44"
        />
      </div>
      <Button type="submit" disabled={!valid}>
        {t("show")}
        <ArrowRight />
      </Button>
      {valid && isWeekend(date) && (
        <p className="w-full text-sm text-muted-foreground">{t("weekend")}</p>
      )}
    </form>
  );
}
