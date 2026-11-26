ALTER TABLE "ulmiversitaet"."banners" DROP CONSTRAINT "banners_tone_check";--> statement-breakpoint
ALTER TABLE "ulmiversitaet"."banners" ADD COLUMN "color" text DEFAULT 'default' NOT NULL;--> statement-breakpoint
-- Existing banners: "Warnung" becomes orange, "Info" keeps the brand color (default)
UPDATE "ulmiversitaet"."banners" SET "color" = 'orange' WHERE "tone" = 'warning';--> statement-breakpoint
ALTER TABLE "ulmiversitaet"."banners" DROP COLUMN "tone";--> statement-breakpoint
ALTER TABLE "ulmiversitaet"."banners" ADD CONSTRAINT "banners_color_check" CHECK (color in ('default', 'red', 'orange', 'yellow', 'green', 'teal', 'blue', 'purple', 'pink', 'gray'));