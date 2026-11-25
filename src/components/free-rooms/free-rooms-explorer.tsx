"use client";

import { ChevronRight } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Label, Select } from "@/components/ui/input";
import {
  Panel,
  PanelBody,
  PanelEmpty,
  PanelHeader,
} from "@/components/ui/panel";
import {
  freeMinutes,
  minutes,
  roomStatus,
  timeFromMinutes,
  type RoomStatus,
  type Slot,
} from "@/features/free-rooms/availability";
import { OCCUPANCY_SOURCE_URL } from "@/features/free-rooms/fetch-occupancy";
import type { DayOccupancy } from "@/features/free-rooms/queries";
import {
  FREE_ROOM_AREAS,
  FREE_ROOM_KINDS,
  type FreeRoom,
  type FreeRoomArea,
  type FreeRoomKind,
} from "@/features/free-rooms/types";
import { timeOfDay, type IsoDate } from "@/lib/date";
import { Link } from "@/lib/i18n/navigation";

export type FreeRoomsDay = {
  date: IsoDate;
  /** "Heute", "Morgen" or the weekday */
  label: string;
  occupancy: DayOccupancy;
};

/** Times to choose from, every half hour while the buildings are open */
const FIRST_TIME = 7 * 60;
const LAST_TIME = 21 * 60;
const TIME_STEP = 30;

const DURATIONS = ["any", "60", "120", "180"] as const;

/** First time offered on a later day */
const DEFAULT_TIME = "08:00";

/**
 * Free lecture halls and seminar rooms at a chosen time, today or on the next weekday. The
 * bookings of both days are loaded once; switching day, time or filters happens in the browser.
 */
export function FreeRoomsExplorer({
  rooms,
  days,
  now: initialNow,
}: {
  rooms: FreeRoom[];
  days: FreeRoomsDay[];
  /** Server time (`HH:MM`), so the first render matches */
  now: string;
}) {
  const t = useTranslations("FreeRooms");
  const tMap = useTranslations("CampusMap");
  const format = useFormatter();

  // On weekends the buildings are closed today, so start with Monday
  const todayClosed = days[0].occupancy.status === "closed";
  const [dayIndex, setDayIndex] = useState(todayClosed ? 1 : 0);
  const [time, setTime] = useState<"now" | string>(
    todayClosed ? DEFAULT_TIME : "now",
  );
  const [kind, setKind] = useState<FreeRoomKind | "all">("all");
  const [area, setArea] = useState<FreeRoomArea | "all">("all");
  const [duration, setDuration] = useState<(typeof DURATIONS)[number]>("any");

  // "Jetzt" follows the clock
  const [now, setNow] = useState(initialNow);
  useEffect(() => {
    const timer = setInterval(() => setNow(timeOfDay()), 30_000);
    return () => clearInterval(timer);
  }, []);

  const { occupancy } = days[dayIndex];
  const isToday = dayIndex === 0;
  const at = time === "now" ? now : time;

  // Today only from now on: bookings that have ended are no longer listed
  const timeOptions = useMemo(() => {
    const options: string[] = [];
    for (let m = FIRST_TIME; m <= LAST_TIME; m += TIME_STEP) {
      if (!isToday || m > minutes(now)) options.push(timeFromMinutes(m));
    }
    return options;
  }, [isToday, now]);

  function selectDay(index: number) {
    setDayIndex(index);
    setTime(index === 0 ? "now" : DEFAULT_TIME);
  }

  const columns: FreeRoomArea[][] =
    area === "all" ? [["ost"], ["west", "helmholtz"]] : [[area]];

  return (
    <>
      <Panel>
        <PanelBody className="space-y-4">
          <div className="flex gap-2" role="group" aria-label={t("day")}>
            {days.map((d, index) => (
              <Button
                key={d.date}
                variant={index === dayIndex ? "default" : "outline"}
                size="sm"
                aria-pressed={index === dayIndex}
                onClick={() => selectDay(index)}
              >
                {d.label}
              </Button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <Field id="free-rooms-time" label={t("time")}>
              <Select
                id="free-rooms-time"
                value={time}
                onChange={(event) => setTime(event.target.value)}
              >
                {isToday && <option value="now">{t("now")}</option>}
                {time !== "now" && !timeOptions.includes(time) && (
                  <option value={time}>{time}</option>
                )}
                {timeOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </Select>
            </Field>
            <Field id="free-rooms-duration" label={t("duration")}>
              <Select
                id="free-rooms-duration"
                value={duration}
                onChange={(event) =>
                  setDuration(event.target.value as typeof duration)
                }
              >
                {DURATIONS.map((option) => (
                  <option key={option} value={option}>
                    {t(`durations.${option}`)}
                  </option>
                ))}
              </Select>
            </Field>
            <Field id="free-rooms-kind" label={t("kind")}>
              <Select
                id="free-rooms-kind"
                value={kind}
                onChange={(event) => setKind(event.target.value as typeof kind)}
              >
                <option value="all">{t("allKinds")}</option>
                {FREE_ROOM_KINDS.map((option) => (
                  <option key={option} value={option}>
                    {tMap(`categories.${option}`)}
                  </option>
                ))}
              </Select>
            </Field>
            <Field id="free-rooms-area" label={t("area")}>
              <Select
                id="free-rooms-area"
                value={area}
                onChange={(event) => setArea(event.target.value as typeof area)}
              >
                <option value="all">{t("allAreas")}</option>
                {FREE_ROOM_AREAS.map((option) => (
                  <option key={option} value={option}>
                    {tMap(`areas.${option}`)}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
        </PanelBody>
      </Panel>

      {occupancy.status === "ok" ? (
        <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-2">
          {columns.map((columnAreas) => (
            <div
              key={columnAreas.join()}
              className={
                columns.length === 1 ? "space-y-4 md:col-span-2" : "space-y-4"
              }
            >
              {columnAreas.map((columnArea) => {
                const areaRooms = rooms.filter(
                  (room) =>
                    room.area === columnArea &&
                    (kind === "all" || room.kind === kind),
                );
                if (areaRooms.length === 0) return null;
                return (
                  <AreaPanel
                    key={columnArea}
                    title={tMap(`areas.${columnArea}`)}
                    rooms={areaRooms}
                    slots={occupancy.rooms}
                    at={at}
                    minFree={duration === "any" ? 0 : Number(duration)}
                  />
                );
              })}
            </div>
          ))}
        </div>
      ) : (
        <Panel>
          <PanelEmpty>
            {occupancy.status === "closed" ? t("closed") : t("unavailable")}
          </PanelEmpty>
        </Panel>
      )}

      {occupancy.status === "ok" && (
        <p className="px-4 text-sm text-muted-foreground md:px-0">
          {t.rich("source", {
            time: format.dateTime(new Date(occupancy.updatedAt), {
              hour: "2-digit",
              minute: "2-digit",
            }),
            link: (chunks) => (
              <a
                href={OCCUPANCY_SOURCE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-4"
              >
                {chunks}
              </a>
            ),
          })}
        </p>
      )}
    </>
  );
}

function Field({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  );
}

/** Free rooms of one area, longest free first; each row opens the room on the campus map */
function AreaPanel({
  title,
  rooms,
  slots,
  at,
  minFree,
}: {
  title: string;
  rooms: FreeRoom[];
  slots: Record<string, Slot[]>;
  at: string;
  minFree: number;
}) {
  const t = useTranslations("FreeRooms");
  const tMap = useTranslations("CampusMap");

  const free = rooms
    .map((room) => {
      const status = roomStatus(slots[room.id] ?? [], at);
      return { room, status, minutes: freeMinutes(status, at) };
    })
    .filter(({ status, minutes }) => status.free && minutes >= minFree)
    .sort(
      (a, b) =>
        b.minutes - a.minutes ||
        a.room.name.localeCompare(b.room.name, undefined, { numeric: true }),
    );

  return (
    <Panel>
      <PanelHeader title={title}>
        {t("freeCount", { free: free.length, total: rooms.length })}
      </PanelHeader>
      {free.length === 0 ? (
        <PanelEmpty>{t("noneFree")}</PanelEmpty>
      ) : (
        <ul className="divide-y divide-border">
          {free.map(({ room, status }) => (
            <li key={room.id}>
              <Link
                href={`/campus-map?p=${room.id}`}
                className="group flex items-center gap-4 px-4 py-3 hover:bg-muted"
              >
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold">
                    {room.name}
                    {room.title && (
                      <span className="font-normal text-muted-foreground">
                        {" "}
                        · {room.title}
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {[
                      tMap(`kinds.${room.kind}`),
                      room.building,
                      room.seats && tMap("seats", { count: room.seats }),
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
                <FreeUntil status={status} />
                <ChevronRight
                  className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                  aria-hidden
                />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

function FreeUntil({ status }: { status: RoomStatus }) {
  const t = useTranslations("FreeRooms");
  if (!status.free) return null;
  return (
    <div className="max-w-[45%] shrink-0 text-right">
      <p className="font-mono text-sm">
        {status.until ? t("until", { time: status.until }) : t("restOfDay")}
      </p>
      {status.next && (
        <p className="truncate text-xs text-muted-foreground">
          {t("next", { title: status.next })}
        </p>
      )}
    </div>
  );
}
