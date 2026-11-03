CREATE TABLE "ulmiversitaet"."events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"location" text,
	"color" text,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"start_time" text,
	"end_time" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "events_dates_check" CHECK (end_date >= start_date),
	CONSTRAINT "events_times_check" CHECK ((start_time is null or start_time ~ '^\d{2}:\d{2}$') and (end_time is null or end_time ~ '^\d{2}:\d{2}$'))
);
--> statement-breakpoint
CREATE INDEX "events_end_date_idx" ON "ulmiversitaet"."events" USING btree ("end_date");