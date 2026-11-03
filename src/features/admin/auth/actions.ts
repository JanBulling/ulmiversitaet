"use server";

import { hasLocale } from "next-intl";
import { redirect } from "next/navigation";
import { z } from "zod";

import { checkCredentials, endSession, startSession } from "@/lib/auth/session";
import { getPathname } from "@/lib/i18n/navigation";
import { routing } from "@/lib/i18n/routing";

/** `username` is sent back so the field keeps its value (React resets forms after an action) */
export type LoginState = { error?: "invalid"; username?: string };

const loginSchema = z.object({
  username: z.string().max(200),
  password: z.string().max(200),
  locale: z.string(),
});

/** Slows down guessing; there is no account lockout */
const FAILED_LOGIN_DELAY_MS = 1000;

export async function login(
  _previous: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "invalid" };

  const { username, password } = parsed.data;
  if (!checkCredentials(username, password)) {
    await new Promise((resolve) => setTimeout(resolve, FAILED_LOGIN_DELAY_MS));
    return { error: "invalid", username };
  }

  await startSession();

  // Root params aren't available in Server Actions, so the form sends the locale
  const locale = hasLocale(routing.locales, parsed.data.locale)
    ? parsed.data.locale
    : routing.defaultLocale;
  redirect(getPathname({ href: "/admin", locale }));
}

export async function logout(formData: FormData) {
  await endSession();
  const locale = String(formData.get("locale"));
  redirect(
    getPathname({
      href: "/admin/login",
      locale: hasLocale(routing.locales, locale)
        ? locale
        : routing.defaultLocale,
    }),
  );
}
