import { solveChallenge } from "altcha-lib";
import { deriveKey } from "altcha-lib/algorithms/pbkdf2";
import { beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const ENV = {
  NEON_DATABASE_URL: "postgresql://user:pass@localhost/db",
  CRON_SECRET: "x".repeat(32),
  ADMIN_USERNAME: "admin",
  ADMIN_PASSWORD: "correct horse battery staple",
  SESSION_SECRET: "s".repeat(48),
};

let humanCheck: typeof import("./human-check");

// `env` is validated when imported, so set the variables first
beforeAll(async () => {
  for (const [key, value] of Object.entries(ENV)) vi.stubEnv(key, value);
  humanCheck = await import("./human-check");
});

/** What the widget submits: base64-encoded JSON of the challenge and its solution */
function encode(payload: unknown) {
  return Buffer.from(JSON.stringify(payload)).toString("base64");
}

async function solvedPayload() {
  const challenge = await humanCheck.createHumanChallenge();
  const solution = await solveChallenge({ challenge, deriveKey });
  return { challenge, solution };
}

describe("verifyHumanPayload", () => {
  it("accepts a solved challenge", async () => {
    expect(
      await humanCheck.verifyHumanPayload(encode(await solvedPayload())),
    ).toBe(true);
  });

  // The server checks the derived key against the key signed into the challenge (not the
  // counter), so a forged solution needs a key that only solving produces
  it("rejects a wrong derived key", async () => {
    const { challenge, solution } = await solvedPayload();
    const key = solution!.derivedKey;
    const wrong = {
      ...solution!,
      derivedKey: key.slice(0, -1) + (key.endsWith("0") ? "1" : "0"),
    };
    expect(
      await humanCheck.verifyHumanPayload(
        encode({ challenge, solution: wrong }),
      ),
    ).toBe(false);
  });

  it("rejects a challenge with changed parameters", async () => {
    const { challenge, solution } = await solvedPayload();
    const tampered = {
      ...challenge,
      parameters: { ...challenge.parameters, cost: 1 },
    };
    expect(
      await humanCheck.verifyHumanPayload(
        encode({ challenge: tampered, solution }),
      ),
    ).toBe(false);
  });

  it("rejects missing and malformed payloads", async () => {
    expect(await humanCheck.verifyHumanPayload(null)).toBe(false);
    expect(await humanCheck.verifyHumanPayload("not base64 json")).toBe(false);
    expect(await humanCheck.verifyHumanPayload(encode({}))).toBe(false);
    expect(
      await humanCheck.verifyHumanPayload(
        encode({ challenge: 1, solution: 2 }),
      ),
    ).toBe(false);
  });
});
