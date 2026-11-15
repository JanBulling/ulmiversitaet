"use server";

import { rememberHuman, verifyHumanPayload } from "./human-check";

export type HumanCheckState = { error?: boolean };

/** Checks the solved ALTCHA challenge; on success the page re-renders with its content */
export async function verifyHuman(
  _previous: HumanCheckState,
  formData: FormData,
): Promise<HumanCheckState> {
  if (!(await verifyHumanPayload(formData.get("altcha")))) {
    return { error: true };
  }
  await rememberHuman();
  return {};
}
