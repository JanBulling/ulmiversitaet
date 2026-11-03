CREATE SCHEMA "ulmiversitaet";
--> statement-breakpoint
CREATE TYPE "ulmiversitaet"."category_kind" AS ENUM('main', 'side', 'dessert', 'other');--> statement-breakpoint
CREATE TABLE "ulmiversitaet"."category_groups" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "ulmiversitaet"."category_groups_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name_de" text NOT NULL,
	"name_en" text,
	"kind" "ulmiversitaet"."category_kind" DEFAULT 'main' NOT NULL,
	"color" text,
	"icon" text,
	"sort_order" integer DEFAULT 100 NOT NULL,
	"show_on_home" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "category_groups_name_de_unique" UNIQUE("name_de")
);
--> statement-breakpoint
CREATE TABLE "ulmiversitaet"."meal_categories" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "ulmiversitaet"."meal_categories_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" text NOT NULL,
	"group_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "meal_categories_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "ulmiversitaet"."meal_history" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "ulmiversitaet"."meal_history_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"date" date NOT NULL,
	"meal_id" uuid NOT NULL,
	"category_id" integer NOT NULL,
	"name" text NOT NULL,
	"name_key" text GENERATED ALWAYS AS (lower(regexp_replace("name", '[^[:alnum:]]+', '', 'g'))) STORED NOT NULL,
	"price_student_cents" integer,
	"price_employee_cents" integer,
	"price_guest_cents" integer,
	"price_note" text,
	"position" smallint DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "meal_history_date_meal_key" UNIQUE("date","meal_id")
);
--> statement-breakpoint
CREATE TABLE "ulmiversitaet"."meal_ratings" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "ulmiversitaet"."meal_ratings_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"meal_id" uuid NOT NULL,
	"taste" smallint NOT NULL,
	"look" smallint NOT NULL,
	"price" smallint NOT NULL,
	"total" real GENERATED ALWAYS AS ((3 * taste + 2 * look + price)::real / 6) STORED NOT NULL,
	"comment" text,
	"hidden_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "meal_ratings_values_check" CHECK (taste between 1 and 5 and look between 1 and 5 and price between 1 and 5),
	CONSTRAINT "meal_ratings_comment_check" CHECK (char_length(comment) <= 1000)
);
--> statement-breakpoint
CREATE TABLE "ulmiversitaet"."meals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"name_key" text GENERATED ALWAYS AS (lower(regexp_replace("name", '[^[:alnum:]]+', '', 'g'))) STORED NOT NULL,
	"name_en" text,
	"category_id" integer NOT NULL,
	"allergens" text[] DEFAULT '{}' NOT NULL,
	"types" text[] DEFAULT '{}' NOT NULL,
	"price_student_cents" integer,
	"price_employee_cents" integer,
	"price_guest_cents" integer,
	"price_note" text,
	"energy_kcal" integer,
	"energy_kj" integer,
	"protein_g" real,
	"fat_g" real,
	"saturated_fat_g" real,
	"carbohydrates_g" real,
	"sugar_g" real,
	"salt_g" real,
	"co2_g" integer,
	"last_served_on" date NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ulmiversitaet"."price_history" (
	"date" date PRIMARY KEY NOT NULL,
	"avg_main_student_cents" real,
	"avg_main_employee_cents" real,
	"avg_main_guest_cents" real,
	"avg_dessert_student_cents" real,
	"avg_side_student_cents" real
);
--> statement-breakpoint
ALTER TABLE "ulmiversitaet"."meal_categories" ADD CONSTRAINT "meal_categories_group_id_category_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "ulmiversitaet"."category_groups"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ulmiversitaet"."meal_history" ADD CONSTRAINT "meal_history_meal_id_meals_id_fk" FOREIGN KEY ("meal_id") REFERENCES "ulmiversitaet"."meals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ulmiversitaet"."meal_history" ADD CONSTRAINT "meal_history_category_id_meal_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "ulmiversitaet"."meal_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ulmiversitaet"."meal_ratings" ADD CONSTRAINT "meal_ratings_meal_id_meals_id_fk" FOREIGN KEY ("meal_id") REFERENCES "ulmiversitaet"."meals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ulmiversitaet"."meals" ADD CONSTRAINT "meals_category_id_meal_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "ulmiversitaet"."meal_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "meal_history_meal_date_idx" ON "ulmiversitaet"."meal_history" USING btree ("meal_id","date" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "meal_history_name_key_idx" ON "ulmiversitaet"."meal_history" USING btree ("name_key");--> statement-breakpoint
CREATE INDEX "meal_ratings_meal_idx" ON "ulmiversitaet"."meal_ratings" USING btree ("meal_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "meals_name_key_idx" ON "ulmiversitaet"."meals" USING btree ("name_key");--> statement-breakpoint
CREATE INDEX "meals_name_trgm_idx" ON "ulmiversitaet"."meals" USING gin ("name" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "meals_category_idx" ON "ulmiversitaet"."meals" USING btree ("category_id");--> statement-breakpoint
CREATE VIEW "ulmiversitaet"."meal_rating_stats" AS (select "meal_id", count(*)::int as "count", avg("taste")::real as "taste", avg("look")::real as "look", avg("price")::real as "price", avg("total")::real as "total", ((count(*) * avg("total") + 2 * 3.0) / (count(*) + 2))::real as "score" from "ulmiversitaet"."meal_ratings" where "ulmiversitaet"."meal_ratings"."hidden_at" is null group by "ulmiversitaet"."meal_ratings"."meal_id");