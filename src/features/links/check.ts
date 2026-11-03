/** Reachability check for the link collection, used by `scripts/check-links.ts` */

export type LinkCheckResult =
  | { status: "ok"; code: number }
  /** Works, but ends up elsewhere (consider updating the link) */
  | { status: "redirected"; code: number; location: string }
  /** 401/403: login page or blocks bots, usually fine */
  | { status: "restricted"; code: number }
  | { status: "broken"; code: number }
  | { status: "unreachable"; error: string };

const TIMEOUT_MS = 15_000;
const USER_AGENT =
  "Mozilla/5.0 (compatible; ulmiversitaet-link-check; +https://www.ulmiversitaet.de)";

export function classify(
  code: number,
  from: string,
  to: string,
): LinkCheckResult {
  if (code === 401 || code === 403) return { status: "restricted", code };
  if (code >= 400) return { status: "broken", code };
  if (!sameTarget(from, to) && !isLandingRedirect(from, to)) {
    return { status: "redirected", code, location: to };
  }
  return { status: "ok", code };
}

/** A start page that forwards to a page on the same host (e.g. `/` → `/login`) is fine */
function isLandingRedirect(from: string, to: string): boolean {
  const a = new URL(from);
  const b = new URL(to);
  return a.hostname === b.hostname && (a.pathname === "/" || a.pathname === "");
}

/** Ignores trailing slashes and http→https upgrades */
function sameTarget(a: string, b: string): boolean {
  const clean = (url: string) =>
    url.replace(/^http:/, "https:").replace(/\/$/, "");
  return clean(a) === clean(b);
}

export async function checkUrl(url: string): Promise<LinkCheckResult> {
  try {
    // Some servers reject HEAD; fall back to GET
    let response = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { "user-agent": USER_AGENT },
    });
    if (response.status === 405 || response.status === 501) {
      response = await fetch(url, {
        method: "GET",
        redirect: "follow",
        signal: AbortSignal.timeout(TIMEOUT_MS),
        headers: { "user-agent": USER_AGENT },
      });
    }
    return classify(response.status, url, response.url || url);
  } catch (error) {
    const cause =
      error instanceof Error && "cause" in error
        ? (error.cause as Error)?.message
        : undefined;
    return { status: "unreachable", error: cause ?? String(error) };
  }
}
