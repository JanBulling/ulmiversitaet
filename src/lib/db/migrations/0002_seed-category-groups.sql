-- Initial category groups (taken from the old mensa app). Editable in the admin dashboard.
INSERT INTO "ulmiversitaet"."category_groups" ("name_de", "name_en", "kind", "color", "icon", "sort_order", "show_on_home") VALUES
  ('Sattmacher',      'Hearty dish',      'main',    '#f97316', 'utensils',    10,  true),
  ('Topf & Pfanne',   'Pot & pan',        'main',    '#3b82f6', 'cooking-pot', 20,  true),
  ('Prima Klima',     'Climate-friendly', 'main',    '#22c55e', 'leaf',        30,  true),
  ('Fleisch & Fisch', 'Meat & fish',      'main',    '#ef4444', 'ham',         40,  true),
  ('Vegan',           'Vegan',            'main',    '#9bbd1d', 'vegan',       50,  true),
  ('Vegetarisch',     'Vegetarian',       'main',    '#22c55e', 'leaf',        60,  true),
  ('Specials',        'Specials',         'main',    '#a957f7', 'gem',         70,  true),
  ('Pizza',           'Pizza',            'main',    '#92400e', 'pizza',       80,  true),
  ('Pasta',           'Pasta',            'main',    '#92400e', 'wheat',       90,  true),
  ('Snacks',          'Snacks',           'main',    '#92400e', 'hamburger',   100, true),
  ('Dessert',         'Dessert',          'dessert', '#ec4899', 'ice-cream',   110, true),
  ('Salat',           'Salad',            'side',    '#65a30d', 'salad',       120, false),
  ('Salatbuffet',     'Salad buffet',     'side',    '#16a34a', 'salad',       130, false),
  ('Beilagen',        'Sides',            'side',    '#525252', 'utensils',    140, false)
ON CONFLICT ("name_de") DO NOTHING;
--> statement-breakpoint
-- Menu headlines seen so far, assigned to their group
INSERT INTO "ulmiversitaet"."meal_categories" ("name", "group_id")
SELECT c.name, g.id
FROM (VALUES
  ('SATTMACHER', 'Sattmacher'),
  ('TOPF + PFANNE', 'Topf & Pfanne'),
  ('TOPF UND PFANNE', 'Topf & Pfanne'),
  ('PRIMA KLIMA', 'Prima Klima'),
  ('FLEISCH + FISCH', 'Fleisch & Fisch'),
  ('FLEISCH UND FISCH', 'Fleisch & Fisch'),
  ('VEGAN', 'Vegan'),
  ('VEGETARISCH', 'Vegetarisch'),
  ('SPECIALS', 'Specials'),
  ('SPECIAL', 'Specials'),
  ('PIZZA', 'Pizza'),
  ('PIZZA I', 'Pizza'),
  ('PIZZA II', 'Pizza'),
  ('PIZZA III', 'Pizza'),
  ('PASTA', 'Pasta'),
  ('SNACKS', 'Snacks'),
  ('CURRYWURST', 'Snacks'),
  ('POMMES', 'Snacks'),
  ('DESSERT', 'Dessert'),
  ('DESSERTS', 'Dessert'),
  ('SALAT', 'Salat'),
  ('SALATBUFFET', 'Salatbuffet'),
  ('BEILAGE', 'Beilagen'),
  ('BEILAGEN', 'Beilagen')
) AS c(name, group_name)
JOIN "ulmiversitaet"."category_groups" g ON g.name_de = c.group_name
ON CONFLICT ("name") DO NOTHING;
