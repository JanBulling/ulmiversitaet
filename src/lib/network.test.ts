import { describe, expect, it } from "vitest";

import { detectUniNetwork, isInCidr } from "./network";

describe("detectUniNetwork", () => {
  it("detects the VPN before eduroam (VPN ranges are inside the uni range)", () => {
    expect(detectUniNetwork("134.60.241.17")).toBe("vpn");
    expect(detectUniNetwork("134.60.250.3")).toBe("vpn");
  });

  it("detects eduroam", () => {
    expect(detectUniNetwork("134.60.12.34")).toBe("eduroam");
    expect(detectUniNetwork("193.197.66.1")).toBe("eduroam");
  });

  it("uses the client address of a forwarded-for list", () => {
    expect(detectUniNetwork("134.60.12.34, 10.0.0.1")).toBe("eduroam");
  });

  it("ignores other and invalid addresses", () => {
    expect(detectUniNetwork("8.8.8.8")).toBeNull();
    expect(detectUniNetwork("2001:db8::1")).toBeNull();
    expect(detectUniNetwork(null)).toBeNull();
  });

  it("handles high octets without sign errors", () => {
    expect(isInCidr("255.255.255.255", "255.255.255.0/24")).toBe(true);
  });
});
