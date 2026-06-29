// ============================================================================
// PKR money + number formatting.
//
// Pakistan uses the SOUTH ASIAN numbering system (lakh / crore), not the
// Western thousands grouping:  Rs 1,23,45,678  — NOT  Rs 12,345,678.
// The `en-IN` locale produces exactly this grouping, so every figure routes
// through one of the helpers below. "Rs" is preferred over the ₨ glyph.
//
//   1 Lakh  (L)  = 100,000        = 1e5
//   1 Crore (Cr) = 10,000,000     = 1e7   = 100 Lakh
// ============================================================================

const grouped0 = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });
const grouped2 = new Intl.NumberFormat("en-IN", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Trim to ≤2 decimals without trailing zeros (4.20 → "4.2", 85 → "85"). */
function trim(x: number): string {
  return (Math.round(x * 100) / 100).toString();
}

/** Long form for tables and the bid waterfall: "Rs 1,23,45,678". */
export function formatPKR(n: number): string {
  const sign = n < 0 ? "-" : "";
  return `${sign}Rs ${grouped0.format(Math.abs(Math.round(n)))}`;
}

/** Two-decimal form for unit rates: "Rs 1,234.50". */
export function formatPKRPrecise(n: number): string {
  const sign = n < 0 ? "-" : "";
  return `${sign}Rs ${grouped2.format(Math.abs(n))}`;
}

/**
 * Short form for cards / KPIs / chart labels: "Rs 4.2 Cr", "Rs 85 L".
 * Falls back to grouped rupees below one lakh.
 */
export function formatPKRShort(n: number): string {
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  if (abs >= 1e7) return `${sign}Rs ${trim(abs / 1e7)} Cr`;
  if (abs >= 1e5) return `${sign}Rs ${trim(abs / 1e5)} L`;
  return `${sign}Rs ${grouped0.format(Math.round(abs))}`;
}

/** Just the magnitude unit, e.g. for axis ticks: "4.2 Cr". */
export function pkrShortBare(n: number): string {
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  if (abs >= 1e7) return `${sign}${trim(abs / 1e7)} Cr`;
  if (abs >= 1e5) return `${sign}${trim(abs / 1e5)} L`;
  return `${sign}${grouped0.format(Math.round(abs))}`;
}

/** Plain quantity with South-Asian grouping: 1,23,456 or 1,234.50. */
export function formatQty(n: number, decimals = 0): string {
  return decimals > 0 ? grouped2.format(n) : grouped0.format(n);
}

/** 16.0% from a decimal fraction. */
export function percent(fraction: number, decimals = 1): string {
  return `${(fraction * 100).toFixed(decimals)}%`;
}
