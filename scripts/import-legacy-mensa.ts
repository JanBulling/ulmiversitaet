/**
 * One-off import of the old mensa app's data (`public.mensa_*`) into the new tables
 * (schema `ulmiversitaet`): meals, the days they were served, ratings with comments, and
 * the daily average prices. The old tables are only read and stay untouched.
 *
 *   IMPORT_DATABASE_URL=… pnpm tsx scripts/import-legacy-mensa.ts            # dry run
 *   IMPORT_DATABASE_URL=… pnpm tsx scripts/import-legacy-mensa.ts --commit   # import
 *
 * Everything runs in one transaction; the dry run prints the same report and rolls back.
 * Meals with the same name (ignoring case and punctuation) are merged, also with meals the
 * new scraper already saved. A comment on the schema marks the import as done, so it can't
 * run twice.
 */
import { neonConfig, Pool } from "@neondatabase/serverless";

neonConfig.webSocketConstructor = WebSocket;

const url = process.env.IMPORT_DATABASE_URL;
const commit = process.argv.includes("--commit");
const DONE_MARKER = "legacy mensa import done";

if (!url) {
  console.error("Set IMPORT_DATABASE_URL to the target database.");
  process.exit(1);
}

/** Same normalization as the generated `name_key` columns */
const nameKey = (column: string) =>
  `lower(regexp_replace(${column}, '[^[:alnum:]]+', '', 'g'))`;

/** First number in a text column ("1.20", "4,5 g") or null */
const number = (column: string) =>
  `replace(substring(${column} from '-?[0-9]+(?:[.,][0-9]+)?'), ',', '.')::numeric`;

const cents = (column: string) => `round(${number(column)} * 100)::int`;

/** Old diet/meat enum → icon codes of the new scraper */
const TYPES: Record<string, string> = {
  VEGAN: "van",
  VEGETARIAN: "veg",
  SCHWEIN: "S",
  RIND: "R",
  LAMM: "L",
  WILDFLEISCH: "W",
  GEFLÜGEL: "G",
  FISCH: "F",
  TINTENFISCH: "T",
};

/** Old allergen enum → codes as printed on the menu */
const ALLERGENS: Record<string, string> = {
  FARBSTOFF: "1",
  KONSERVIERUNGSSTOFF: "2",
  ANTIOXIDATIONSMITTEL: "3",
  GESCHMACKSVERSTÄRKER: "4",
  GESCHWEFELT: "5",
  GESCHWÄRZT: "6",
  GEWACHST: "7",
  PHOSPHAT: "8",
  SÜSSUNGSMITTEL: "9",
  PHENYLALIN: "10",
  KREBSTIERE: "13",
  EIER: "14",
  "GELATINE (SCHWEIN)": "18",
  "GELATINE (RIND)": "18R",
  ERDNÜSSE: "22",
  SOJA: "23",
  MILCH: "24",
  HASELNUSS: "25H",
  WALLNUSS: "25W",
  PISTAZIE: "25P",
  MANDEL: "25MN",
  CASHEW: "25C",
  MACADEMIA: "25MA",
  PEKANUS: "25PK",
  SELLERIE: "26",
  SENF: "27",
  SESAM: "28",
  SCHWEFELDIOXID: "29",
  SULFITE: "30",
  LUPINE: "31",
  WEICHTIERE: "32",
  WEIZEN: "34W",
  HAFER: "34H",
  ROGGEN: "34R",
  DINKEL: "34D",
  FISCH: "35",
  GLUTEN: "GL",
};

/** `array(select map(value) from unnest(column))`, keeping unknown values as they are */
const mapArray = (column: string, map: Record<string, string>) => {
  const cases = Object.entries(map)
    .map(([from, to]) => `when '${from.replace(/'/g, "''")}' then '${to}'`)
    .join(" ");
  return `coalesce(array(select case v::text ${cases} else v::text end from unnest(${column}) as v), '{}')`;
};

const steps: { label: string; sql: string }[] = [
  {
    label: "Old meals (with name key and last menu date)",
    sql: `
      create temp table legacy_meals on commit drop as
      select m.*, ${nameKey("m.name")} as key,
        (select max(p.date) from public.mensa_mensa_plan p where p.meal_id = m.id) as last_date
      from public.mensa_meals m`,
  },
  {
    label:
      "Categories of the old menu (unknown ones are added without a group)",
    sql: `
      insert into ulmiversitaet.meal_categories (name)
      select distinct category::text from public.mensa_meals
      on conflict (name) do nothing`,
  },
  {
    label: "One canonical old meal per name",
    sql: `
      create temp table canonical on commit drop as
      select distinct on (key) key, id as legacy_id
      from legacy_meals
      order by key, last_date desc nulls last, created_at desc`,
  },
  {
    label: "Map: old meal → meal the new scraper already knows by name",
    sql: `
      create temp table meal_map (legacy_id uuid primary key, new_id uuid not null) on commit drop;
      insert into meal_map
      select c.legacy_id, existing.id
      from canonical c
      cross join lateral (
        select n.id from ulmiversitaet.meals n
        where n.name_key = c.key
           or n.id in (select h.meal_id from ulmiversitaet.meal_history h where h.name_key = c.key)
        order by n.last_served_on desc
        limit 1
      ) existing`,
  },
  {
    label: "Map: remaining old meals keep their id",
    sql: `
      insert into meal_map
      select c.legacy_id, c.legacy_id from canonical c
      where not exists (select 1 from meal_map m where m.legacy_id = c.legacy_id)`,
  },
  {
    label: "Map: duplicate old meals → their canonical meal",
    sql: `
      insert into meal_map
      select l.id, m.new_id
      from legacy_meals l
      join canonical c on c.key = l.key
      join meal_map m on m.legacy_id = c.legacy_id
      where l.id <> c.legacy_id`,
  },
  {
    label: "Meals",
    sql: `
      insert into ulmiversitaet.meals (
        id, name, name_en, category_id, allergens, types,
        price_student_cents, price_employee_cents, price_guest_cents, price_note,
        energy_kcal, protein_g, fat_g, saturated_fat_g, carbohydrates_g, sugar_g, salt_g,
        last_served_on, created_at, updated_at
      )
      select
        l.id, l.name, nullif(trim(l.name_en), ''), c.id,
        ${mapArray("l.allergy", ALLERGENS)}, ${mapArray("l.types", TYPES)},
        ${cents("l.price_student")}, ${cents("l.price_employee")}, ${cents("l.price_others")},
        nullif(trim(l.price_note), ''),
        round(${number("l.nutrition_calories")})::int,
        ${number("l.nutrition_protein")}::real, ${number("l.nutrition_fat")}::real,
        ${number("l.nutrition_saturated_fat")}::real,
        ${number("l.nutrition_carbohydrates")}::real, ${number("l.nutrition_sugar")}::real,
        ${number("l.nutrition_salt")}::real,
        coalesce(l.last_date, l.created_at::date),
        l.created_at at time zone 'UTC', l.updated_at at time zone 'UTC'
      from legacy_meals l
      join meal_map m on m.legacy_id = l.id and m.new_id = l.id
      join ulmiversitaet.meal_categories c on c.name = l.category::text
      on conflict (id) do nothing`,
  },
  {
    label:
      "Menu history (days the new scraper already saved are left as they are)",
    sql: `
      insert into ulmiversitaet.meal_history (
        date, meal_id, category_id, name,
        price_student_cents, price_employee_cents, price_guest_cents, price_note, position
      )
      select
        p.date, m.new_id, c.id, l.name,
        ${cents("l.price_student")}, ${cents("l.price_employee")}, ${cents("l.price_others")},
        nullif(trim(l.price_note), ''),
        (row_number() over (partition by p.date order by p.id) - 1)::smallint
      from public.mensa_mensa_plan p
      join legacy_meals l on l.id = p.meal_id
      join meal_map m on m.legacy_id = l.id
      join ulmiversitaet.meal_categories c on c.name = l.category::text
      where not exists (select 1 from ulmiversitaet.meal_history h where h.date = p.date)
      on conflict (date, meal_id) do nothing`,
  },
  {
    label: "Ratings and comments",
    sql: `
      insert into ulmiversitaet.meal_ratings (meal_id, taste, look, price, comment, created_at)
      select
        m.new_id,
        least(5, greatest(1, round(r.rating_taste)))::smallint,
        least(5, greatest(1, round(r.rating_look)))::smallint,
        least(5, greatest(1, round(r.rating_price)))::smallint,
        left(nullif(trim(r.text), ''), 1000),
        r.created_at at time zone 'UTC'
      from public.mensa_ratings r
      join meal_map m on m.legacy_id = r.meal_id
      order by r.created_at`,
  },
  {
    label:
      "Daily average prices (euros → cents; days the new scraper saved are kept)",
    sql: `
      insert into ulmiversitaet.price_history (
        date, avg_main_student_cents, avg_main_employee_cents, avg_main_guest_cents,
        avg_dessert_student_cents, avg_side_student_cents
      )
      select date, avg_price_student * 100, avg_price_employee * 100, avg_price_others * 100,
        avg_price_deserts * 100, avg_price_sides * 100
      from public.mensa_price_tracking
      order by id desc
      on conflict (date) do nothing`,
  },
];

const REPORT = `
  select
    (select count(*) from public.mensa_meals)::int as old_meals,
    (select count(distinct new_id) from meal_map)::int as meals_after_merge,
    (select count(*) from meal_map where new_id = legacy_id)::int as meals_inserted,
    (select count(*) from canonical c join meal_map m on m.legacy_id = c.legacy_id where m.new_id <> c.legacy_id)::int as matched_existing,
    (select count(*) from public.mensa_mensa_plan)::int as old_menu_entries,
    (select count(*) from ulmiversitaet.meal_history)::int as history_rows,
    (select count(*) from public.mensa_ratings)::int as old_ratings,
    (select count(*) from public.mensa_ratings where nullif(trim(text), '') is not null)::int as old_comments,
    (select count(*) from ulmiversitaet.meal_ratings)::int as ratings,
    (select count(*) from ulmiversitaet.meal_ratings where comment is not null)::int as comments,
    (select count(*) from public.mensa_price_tracking)::int as old_price_days,
    (select count(*) from ulmiversitaet.price_history)::int as price_days`;

/** Meals whose number of imported ratings differs from the old app (should be none) */
const MISMATCHES = `
  select m.new_id, count(r.id)::int as old, coalesce(n.count, 0)::int as new
  from meal_map m
  join public.mensa_ratings r on r.meal_id = m.legacy_id
  left join ulmiversitaet.meal_rating_stats n on n.meal_id = m.new_id
  group by m.new_id, n.count
  having count(r.id) > coalesce(n.count, 0)`;

const SAMPLE = `
  select n.name, s.count, round(s.total::numeric, 2) as total, old.num_ratings as old_count,
    round(old.rating_total::numeric, 2) as old_total
  from public.mensa_meals old
  join meal_map m on m.legacy_id = old.id
  join ulmiversitaet.meals n on n.id = m.new_id
  join ulmiversitaet.meal_rating_stats s on s.meal_id = n.id
  order by old.num_ratings desc nulls last
  limit 5`;

async function main(databaseUrl: string) {
  const pool = new Pool({ connectionString: databaseUrl });
  const client = await pool.connect();

  try {
    const host = new URL(databaseUrl).host;
    console.log(`${commit ? "IMPORT" : "DRY RUN"} on ${host}\n`);

    const [{ marker }] = (
      await client.query(
        `select obj_description('ulmiversitaet'::regnamespace, 'pg_namespace') as marker`,
      )
    ).rows;
    if (marker?.startsWith(DONE_MARKER)) {
      throw new Error(`Already imported (${marker}).`);
    }

    await client.query("begin");
    for (const step of steps) {
      const result = await client.query(step.sql);
      const rows = Array.isArray(result)
        ? result.at(-1)?.rowCount
        : result.rowCount;
      console.log(`✓ ${step.label}${rows ? `: ${rows}` : ""}`);
    }

    console.log("\nReport");
    console.table((await client.query(REPORT)).rows);
    const mismatches = (await client.query(MISMATCHES)).rows;
    console.log(
      mismatches.length === 0
        ? "✓ Every old rating was imported"
        : `✗ ${mismatches.length} meals are missing ratings`,
      mismatches.slice(0, 5),
    );
    console.log("\nMost rated meals (new vs. old)");
    console.table((await client.query(SAMPLE)).rows);

    if (commit) {
      await client.query(
        `comment on schema ulmiversitaet is '${DONE_MARKER} ${new Date().toISOString()}'`,
      );
      await client.query("commit");
      console.log("\nCommitted.");
    } else {
      await client.query("rollback");
      console.log("\nDry run: rolled back, nothing was changed.");
    }
  } catch (error) {
    await client.query("rollback").catch(() => {});
    console.error(error);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

void main(url);
