import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const ENV = {
  NEON_DATABASE_URL: "postgresql://user:pass@localhost/db",
  CRON_SECRET: "x".repeat(32),
  ADMIN_USERNAME: "admin",
  ADMIN_PASSWORD: "correct horse battery staple",
  SESSION_SECRET: "s".repeat(48),
};

// `env` is validated when imported, so set the variables first and import fresh per test
async function loadToken(overrides: Partial<typeof ENV> = {}) {
  for (const [key, value] of Object.entries({ ...ENV, ...overrides })) {
    vi.stubEnv(key, value);
  }
  vi.resetModules();
  return import("./token");
}

describe("session token", () => {
  beforeEach(() => vi.resetModules());
  afterEach(() => vi.unstubAllEnvs());

  it("accepts its own tokens", async () => {
    const { createSessionToken, verifySessionToken } = await loadToken();
    expect(await verifySessionToken(await createSessionToken())).toBe(true);
  });

  it("rejects missing and tampered tokens", async () => {
    const { createSessionToken, verifySessionToken } = await loadToken();
    const token = await createSessionToken();
    const [header, payload, signature] = token.split(".");
    const forged = Buffer.from(
      JSON.stringify({ role: "admin", exp: 9999999999 }),
    ).toString("base64url");

    expect(await verifySessionToken(undefined)).toBe(false);
    expect(await verifySessionToken("not-a-token")).toBe(false);
    expect(await verifySessionToken(`${header}.${forged}.${signature}`)).toBe(
      false,
    );
    expect(
      await verifySessionToken(
        `${header}.${payload}.${signature.slice(0, -2)}xx`,
      ),
    ).toBe(false);
  });

  it("invalidates all sessions when the password or secret changes", async () => {
    const token = await (await loadToken()).createSessionToken();

    const changedPassword = await loadToken({
      ADMIN_PASSWORD: "a new password",
    });
    expect(await changedPassword.verifySessionToken(token)).toBe(false);

    const changedSecret = await loadToken({ SESSION_SECRET: "t".repeat(48) });
    expect(await changedSecret.verifySessionToken(token)).toBe(false);
  });
});
