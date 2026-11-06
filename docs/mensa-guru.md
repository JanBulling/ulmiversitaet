# Mensa Guru

Below today's menu on the home page, "Frage den Guru" asks Google's Gemini model to pick the best meal of the day. The answer is written by an overdramatic canteen guru in the selected language, typed out in a gradient box, with a link to the chosen meal. The button only appears when `GEMINI_API_KEY` is set and there is a menu today.

## How it works

1. The button (`src/components/mensa/mensa-guru.tsx`) calls the Server Action `askGuru(locale)` (`src/features/mensa/actions.ts`).
2. `getGuruAdvice(date, locale)` (`src/features/mensa/guru.ts`) sends all meals of the day with their ratings (averages for overall, taste, look and value for money, plus the number of ratings), category, diet, price, calories and protein to Gemini. Comments are not sent. The model answers with JSON `{ mealId, message }`. The schema only allows ids of today's meals, and `parseGuruAnswer()` checks the answer again.
3. The answer is cached per day and language (`"use cache"`, mensa tag). The free tier is used about once per day and language. A new rating, an admin change or a menu sync clears the cache, so the guru reconsiders on the next click. Errors are not cached: the button shows "Der Guru meditiert gerade…" with a retry, and the real reason is logged as `[mensa-guru]`.

Prompt and parsing live in `src/features/mensa/guru-prompt.ts` (tested without an API key in `guru-prompt.test.ts`).

## Setup

1. Create a free API key at https://aistudio.google.com/apikey (Google account needed, no billing).
2. Set `GEMINI_API_KEY` in `.env.local` and in the Vercel project settings, then redeploy. The home page is prerendered, so the button only appears after a new deployment (or a dev server restart).

Free tier: Google may use the requests to improve its products. Only the public menu and aggregated ratings are sent, no personal data (see `src/content/legal/datenschutz.md`).

## Where to change what

| What                         | File                                                            | Notes                                                                          |
| ---------------------------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Model                        | `GEMINI_MODEL` env var, default in `src/features/mensa/guru.ts` | Default `gemini-3.5-flash-lite` (free tier). Change it when Google retires it. |
| Personality, rules, length   | `src/features/mensa/guru-prompt.ts` → `guruSystemInstruction()` | The answer language comes from the page locale.                                |
| Data sent per meal           | `src/features/mensa/guru-prompt.ts` → `guruMeals()`             |                                                                                |
| Button, smoke, typing effect | `src/components/mensa/mensa-guru.tsx`                           | Same gradient as on the previous site; animations in `globals.css`.            |
| Texts                        | `src/lib/i18n/messages/{de,en}.json` → `Mensa.askGuru`, `guru*` |                                                                                |
