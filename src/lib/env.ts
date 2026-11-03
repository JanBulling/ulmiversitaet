import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

/**
 * Typed and validated environment variables.
 * Set `SKIP_ENV_VALIDATION=1` to skip validation (e.g. in CI lint jobs).
 *
 * Optional variables are only needed by features that have not been ported yet.
 * Make them required once the feature using them lands.
 */
export const env = createEnv({
  server: {
    NEON_DATABASE_URL: z.url(),

    // Vercel cron jobs (mensa scraper)
    CRON_SECRET: z.string().min(16),

    // Admin dashboard (/admin): the single account and the key for signing its session cookie
    ADMIN_USERNAME: z.string().min(1),
    ADMIN_PASSWORD: z.string().min(1),
    SESSION_SECRET: z.string().min(32),

    // Mensa guru + English meal names
    GEMINI_API_KEY: z.string().min(1).optional(),
  },
  client: {},
  experimental__runtimeEnv: {},
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  emptyStringAsUndefined: true,
});
