import { jwtVerify, SignJWT } from "jose";

import { env } from "@/lib/env";

/**
 * Signed session token for the admin. Kept free of `next/headers` so `proxy.ts` can use it.
 * The key includes the admin password, so changing the password logs out every session.
 */

export const SESSION_COOKIE = "ulm_admin_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

async function signingKey() {
  const material = new TextEncoder().encode(
    `${env.SESSION_SECRET}:${env.ADMIN_PASSWORD}`,
  );
  return new Uint8Array(await crypto.subtle.digest("SHA-256", material));
}

export async function createSessionToken(): Promise<string> {
  return new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(await signingKey());
}

export async function verifySessionToken(
  token: string | undefined,
): Promise<boolean> {
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, await signingKey(), {
      algorithms: ["HS256"],
    });
    return payload.role === "admin";
  } catch {
    return false;
  }
}
