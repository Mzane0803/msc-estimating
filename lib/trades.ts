// ============================================================================
// Pakistani construction estimating reference data.
//
// Replaces CSI MasterFormat with how estimating actually works here: a Bill of
// Quantities (BOQ) priced against a provincial Composite Schedule of Rates.
// ============================================================================

import type { Markups, Levies } from "./types";

// --- Trades (BOQ groups) ----------------------------------------------------
export const TRADES = [
  { id: "earthwork", name: "Earthwork", short: "Earth" },
  { id: "concrete", name: "PCC / RCC", short: "Concrete" },
  { id: "reinforcement", name: "Reinforcement (Steel)", short: "Steel" },
  { id: "masonry", name: "Brickwork / Blockwork", short: "Masonry" },
  { id: "plaster", name: "Plaster", short: "Plaster" },
  { id: "flooring", name: "Flooring / Tiling", short: "Flooring" },
  { id: "joinery", name: "Wood & Joinery", short: "Joinery" },
  { id: "openings", name: "Doors / Windows", short: "Openings" },
  { id: "paint", name: "Paint", short: "Paint" },
  { id: "plumbing", name: "Plumbing & Sanitary", short: "Plumbing" },
  { id: "electrical", name: "Electrical", short: "Electrical" },
  { id: "external", name: "External Development", short: "External" },
] as const;

export type TradeId = (typeof TRADES)[number]["id"];

const TRADE_INDEX: Record<string, number> = Object.fromEntries(
  TRADES.map((t, i) => [t.id, i]),
);

export function tradeName(id: TradeId): string {
  return TRADES.find((t) => t.id === id)?.name ?? "Other";
}
export function tradeShort(id: TradeId): string {
  return TRADES.find((t) => t.id === id)?.short ?? "Other";
}
/** Stable display order index for a trade. */
export function tradeOrder(id: string): number {
  return TRADE_INDEX[id] ?? 99;
}

// --- Units of measure -------------------------------------------------------
// Sft = square foot, Rft = running foot, Cft = cubic foot, Cum = cubic metre,
// Sqm = square metre, %Cft = per 100 cft, Bag = cement bag, Ton = steel,
// 1000No = per thousand (bricks), Marla/Kanal = land.
export const UNITS = [
  "Sft", "Rft", "Cft", "Cum", "Sqm", "%Cft",
  "Each", "Job", "Bag", "Ton", "1000No", "Marla", "Kanal", "Day", "Month",
] as const;
export type Unit = (typeof UNITS)[number];

// --- Provinces & their service-tax authorities ------------------------------
export const PROVINCES = [
  { id: "punjab", name: "Punjab", authority: "PRA", salesTax: 0.16 },
  { id: "sindh", name: "Sindh", authority: "SRB", salesTax: 0.15 },
  { id: "kpk", name: "Khyber Pakhtunkhwa", authority: "KPRA", salesTax: 0.15 },
  { id: "balochistan", name: "Balochistan", authority: "BRA", salesTax: 0.15 },
  { id: "federal", name: "Islamabad (ICT)", authority: "FBR", salesTax: 0.16 },
] as const;
export type ProvinceId = (typeof PROVINCES)[number]["id"];

export function province(id: ProvinceId) {
  return PROVINCES.find((p) => p.id === id) ?? PROVINCES[0];
}

// --- Composite Schedules of Rates ------------------------------------------
export const CSR_SCHEDULES = [
  "Punjab CSR 2022",
  "Sindh CSR 2023",
  "KPK CSR 2022",
  "MES Schedule",
  "Custom",
] as const;
export type CSRSchedule = (typeof CSR_SCHEDULES)[number];

// --- PEC contractor categories & financial ceilings -------------------------
// Pakistan Engineering Council gates the max single-project value a contractor
// may bid by registration category. Limits below are indicative (in PKR).
export const PEC_CATEGORIES = [
  { id: "C-A", label: "C-A", ceiling: Infinity, note: "No limit" },
  { id: "C-B", label: "C-B", ceiling: 4_000_000_000 },
  { id: "C-1", label: "C-1", ceiling: 2_500_000_000 },
  { id: "C-2", label: "C-2", ceiling: 1_000_000_000 },
  { id: "C-3", label: "C-3", ceiling: 500_000_000 },
  { id: "C-4", label: "C-4", ceiling: 200_000_000 },
  { id: "C-5", label: "C-5", ceiling: 65_000_000 },
  { id: "C-6", label: "C-6", ceiling: 25_000_000 },
] as const;
export type PecCategory = (typeof PEC_CATEGORIES)[number]["id"];

export function pecCeiling(cat: PecCategory): number {
  return PEC_CATEGORIES.find((c) => c.id === cat)?.ceiling ?? Infinity;
}

// --- Markup waterfall order (overhead → profit → contingency → sales tax) ---
// These four COMPOUND to build the submitted bid. Sales tax on services
// (PRA/SRB) is the only statutory line added to the contract value here.
export const MARKUP_ORDER: { key: keyof Markups; label: string; short: string }[] = [
  { key: "overhead", label: "Contractor Overhead", short: "OH" },
  { key: "profit", label: "Profit", short: "Profit" },
  { key: "contingency", label: "Contingency", short: "Cont." },
  { key: "salesTax", label: "Sales Tax on Services", short: "GST" },
];

// Levies/securities computed off the bid but NOT part of the works price.
export const LEVY_META: {
  key: keyof Levies;
  label: string;
  hint: string;
  /** "deduct" reduces contractor receipt; "security" is a guarantee; "advance" is cash in. */
  kind: "deduct" | "security" | "advance";
}[] = [
  {
    key: "incomeTaxWithholding",
    label: "Income Tax Withholding",
    hint: "Deducted by client from each payment (filer vs non-filer)",
    kind: "deduct",
  },
  {
    key: "bidSecurity",
    label: "Bid Security / Earnest Money",
    hint: "Bank guarantee furnished with the bid",
    kind: "security",
  },
  {
    key: "performanceGuarantee",
    label: "Performance Guarantee",
    hint: "Furnished on award, against contract value",
    kind: "security",
  },
  {
    key: "mobilizationAdvance",
    label: "Mobilization Advance",
    hint: "Paid up-front by client — cash flow, not a cost",
    kind: "advance",
  },
];
