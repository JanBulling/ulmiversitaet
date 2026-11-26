CREATE TABLE "ulmiversitaet"."banners" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"title_en" text,
	"description_en" text,
	"link" text,
	"tone" text DEFAULT 'info' NOT NULL,
	"visible" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "banners_tone_check" CHECK (tone in ('info', 'warning'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX "banners_one_visible_idx" ON "ulmiversitaet"."banners" USING btree ("visible") WHERE visible;