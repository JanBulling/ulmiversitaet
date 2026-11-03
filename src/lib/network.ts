/** Detects whether a request comes from the university network (eduroam) or its VPN */

const VPN_RANGES = ["134.60.240.0/23", "134.60.246.0/23", "134.60.248.0/22"];
const EDUROAM_RANGES = ["134.60.0.0/16", "193.197.64.0/22"];

export type UniNetwork = "vpn" | "eduroam";

export function detectUniNetwork(
  ip: string | null | undefined,
): UniNetwork | null {
  // `x-forwarded-for` can be a list: "client, proxy1, proxy2"
  const client = ip?.split(",")[0]?.trim();
  if (!client || !/^\d{1,3}(\.\d{1,3}){3}$/.test(client)) return null;

  if (VPN_RANGES.some((range) => isInCidr(client, range))) return "vpn";
  if (EDUROAM_RANGES.some((range) => isInCidr(client, range))) return "eduroam";
  return null;
}

export function isInCidr(ip: string, cidr: string): boolean {
  const [range, bits] = cidr.split("/");
  const maskBits = Number(bits);
  const mask = maskBits === 0 ? 0 : ~((1 << (32 - maskBits)) - 1) >>> 0;
  return (ipToInt(ip) & mask) >>> 0 === (ipToInt(range) & mask) >>> 0;
}

function ipToInt(ip: string): number {
  return (
    ip.split(".").reduce((value, octet) => (value << 8) + Number(octet), 0) >>>
    0
  );
}
