/**
 * Every other page: no banner. Needed besides `default.tsx`, because on client-side navigation
 * a slot keeps showing its last page when nothing matches.
 */
export default function NoBanner() {
  return null;
}
