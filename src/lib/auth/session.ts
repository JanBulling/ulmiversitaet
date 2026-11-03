import "server-only";

import { createHash, timingSafeEqual } from "node:crypto";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

import { env } from "@/lib/env";
import {
  createSessionToken,
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
  verifySessionToken,
} from "./token";

export const LOGIN_PATH = "/admin/login";

/** Whether the current request has a valid admin session (checked once per request) */
export const isAdmin = cache(async (): Promise<boolean> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return verifySessionToken(token);
});

/**
 * Data access guard: call at the start of every admin page, query, and Server Action.
 * `proxy.ts` only does an optimistic check; this is the real one.
 */
export async function requireAdmin(): Promise<void> {
  if (!(await isAdmin())) redirect(LOGIN_PATH);
}

/** Constant-time comparison against the credentials from the environment */
export function checkCredentials(username: string, password: string): boolean {
  const hash = (value: string) => createHash("sha256").update(value).digest();
  const userOk = timingSafeEqual(hash(username), hash(env.ADMIN_USERNAME));
  const passwordOk = timingSafeEqual(hash(password), hash(env.ADMIN_PASSWORD));
  return userOk && passwordOk;
}

export async function startSession(): Promise<void> {
  (await cookies()).set(SESSION_COOKIE, await createSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export async function endSession(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
}
