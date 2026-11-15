import "server-only";

import { createHmac } from "node:crypto";

import {
  createChallenge,
  randomInt,
  verifySolution,
  type Challenge,
  type Solution,
} from "altcha-lib";
import { deriveKey } from "altcha-lib/algorithms/pbkdf2";
import { jwtVerify, SignJWT } from "jose";
import { cookies } from "next/headers";
import { cache } from "react";

import { env } from "@/lib/env";

/**
 * Human check for pages that would query the database for bots, e.g. old menus: a
 * self-hosted ALTCHA proof-of-work challenge (no third party, no tracking). Solving it sets a
 * signed cookie, so visitors only solve it once a month.
 */

export const HUMAN_COOKIE = "ulm_human";
const HUMAN_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days
const CHALLENGE_TTL_MS = 10 * 60 * 1000;

/** Secrets derived from `SESSION_SECRET`, one per purpose, so no extra variable is needed */
function secret(purpose: string) {
  return createHmac("sha256", env.SESSION_SECRET)
    .update(`human-check:${purpose}`)
    .digest();
}

const challengeSecret = () => secret("challenge").toString("hex");
const keySecret = () => secret("key").toString("hex");

/**
 * About a second of work in a phone browser, verified instantly on the server (the expected
 * key is signed into the challenge)
 */
export function createHumanChallenge(): Promise<Challenge> {
  return createChallenge({
    algorithm: "PBKDF2/SHA-256",
    cost: 1_000,
    counter: randomInt(2_000, 5_000),
    deriveKey,
    expiresAt: new Date(Date.now() + CHALLENGE_TTL_MS),
    hmacSignatureSecret: challengeSecret(),
    hmacKeySignatureSecret: keySecret(),
  });
}

/**
 * The widget submits base64-encoded JSON with the challenge and its solution. Malformed
 * payloads make `verifySolution` throw, which counts as failed.
 */
export async function verifyHumanPayload(payload: unknown): Promise<boolean> {
  if (typeof payload !== "string") return false;
  try {
    const { challenge, solution } = JSON.parse(
      Buffer.from(payload, "base64").toString(),
    ) as { challenge?: Challenge; solution?: Solution };
    if (!challenge || !solution) return false;

    const result = await verifySolution({
      challenge,
      solution,
      deriveKey,
      hmacSignatureSecret: challengeSecret(),
      hmacKeySignatureSecret: keySecret(),
    });
    return result.verified;
  } catch {
    return false;
  }
}

/** Whether the current request comes from a visitor who solved the check (once per request) */
export const isVerifiedHuman = cache(async (): Promise<boolean> => {
  const token = (await cookies()).get(HUMAN_COOKIE)?.value;
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, secret("cookie"), {
      algorithms: ["HS256"],
    });
    return payload.human === true;
  } catch {
    return false;
  }
});

/** Only callable from Server Actions; setting the cookie re-renders the current page */
export async function rememberHuman(): Promise<void> {
  const token = await new SignJWT({ human: true })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${HUMAN_MAX_AGE_SECONDS}s`)
    .sign(secret("cookie"));

  (await cookies()).set(HUMAN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: HUMAN_MAX_AGE_SECONDS,
  });
}
