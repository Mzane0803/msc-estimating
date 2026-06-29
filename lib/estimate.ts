// ============================================================================
// estimate.ts — the single source of truth for all bid math. PURE functions
// only (no I/O, no mutation) so it is trivially unit-testable and reusable.
// ============================================================================

import type {
  CostCategory,
  KeyMaterials,
  LineItem,
  Levies,
  Markups,
  Project,
} from "./types";
import { MARKUP_ORDER, tradeName, tradeOrder } from "./trades";

/** Sum of the cost buckets for a single unit (material + labor + equipment). */
export function unitTotal(cost: { material: number; labor: number; equipment: number }): number {
  return cost.material + cost.labor + cost.equipment;
}

/** Extended (line) cost = quantity × per-unit total. */
export function extendedCost(item: LineItem): number {
  return item.quantity * unitTotal(item.cost);
}

/** Direct cost = sum of every line's extended cost (before any markup). */
export function directCost(items: LineItem[]): number {
  return items.reduce((sum, item) => sum + extendedCost(item), 0);
}

/** Direct cost for the lines of one trade. */
export function tradeSubtotal(items: LineItem[], tradeId: string): number {
  return directCost(items.filter((i) => i.tradeId === tradeId));
}

export interface TradeRollup {
  tradeId: string;
  name: string;
  amount: number;
  share: number; // 0–1
  itemCount: number;
}

/** Roll line items up by trade, sorted by canonical trade order, with share. */
export function costByTrade(items: LineItem[]): TradeRollup[] {
  const total = directCost(items);
  const byTrade = new Map<string, { amount: number; count: number }>();
  for (const item of items) {
    const e = byTrade.get(item.tradeId) ?? { amount: 0, count: 0 };
    e.amount += extendedCost(item);
    e.count += 1;
    byTrade.set(item.tradeId, e);
  }
  return [...byTrade.entries()]
    .map(([tradeId, { amount, count }]) => ({
      tradeId,
      name: tradeName(tradeId as never),
      amount,
      share: total > 0 ? amount / total : 0,
      itemCount: count,
    }))
    .sort((a, b) => tradeOrder(a.tradeId) - tradeOrder(b.tradeId));
}

/** Direct cost split by material / labor / equipment. */
export function costByCategory(items: LineItem[]): Record<CostCategory, number> {
  const totals: Record<CostCategory, number> = { material: 0, labor: 0, equipment: 0 };
  for (const item of items) {
    totals.material += item.quantity * item.cost.material;
    totals.labor += item.quantity * item.cost.labor;
    totals.equipment += item.quantity * item.cost.equipment;
  }
  return totals;
}

/**
 * Total procurement quantities of the key materials across the whole BOQ.
 * Contractors buy against these (cement bags, steel tons, bricks, sand, crush).
 */
export function keyMaterialTotals(items: LineItem[]): Required<KeyMaterials> {
  const t: Required<KeyMaterials> = {
    cementBags: 0,
    steelTons: 0,
    bricks: 0,
    sandCft: 0,
    aggregateCft: 0,
  };
  for (const item of items) {
    const m = item.keyMaterials;
    if (!m) continue;
    t.cementBags += (m.cementBags ?? 0) * item.quantity;
    t.steelTons += (m.steelTons ?? 0) * item.quantity;
    t.bricks += (m.bricks ?? 0) * item.quantity;
    t.sandCft += (m.sandCft ?? 0) * item.quantity;
    t.aggregateCft += (m.aggregateCft ?? 0) * item.quantity;
  }
  return t;
}

export interface MarkupLine {
  key: keyof Markups;
  label: string;
  rate: number;
  base: number; // running subtotal this markup applied to
  amount: number;
}

export interface BidResult {
  directCost: number;
  markupLines: MarkupLine[];
  /** Direct + overhead + profit + contingency (pre-tax works value). */
  worksValue: number;
  salesTaxAmount: number;
  totalMarkup: number;
  /** Final submitted bid / contract value (works value + sales tax). */
  bidTotal: number;
  costPerSft: number;
  profitAmount: number;
  netMargin: number; // profit ÷ bid
  contingencyAmount: number;
  overrunBuffer: number; // (contingency + profit) ÷ direct cost

  // Levies & securities (computed off the bid, shown separately)
  incomeTaxAmount: number;
  netReceipt: number; // bid − income tax withheld
  bidSecurityAmount: number;
  performanceGuaranteeAmount: number;
  mobilizationAmount: number;
}

/**
 * Compute the full bid for a project.
 *
 *   MARKUP WATERFALL
 *   ----------------
 *   overhead → profit → contingency → sales tax. Each line COMPOUNDS on the
 *   running subtotal (not on direct cost alone), so profit is earned on top of
 *   overhead, and provincial sales tax (PRA/SRB) is charged on the full marked-up
 *   works value the client actually pays.
 *
 *     running = directCost
 *     for each markup m (in order):  running += running × rate(m)
 *     bidTotal = running
 *
 *   LEVIES (separate, NOT added to the works price)
 *   ----------------------------------------------
 *   • income-tax withholding is DEDUCTED from the contractor's receipt
 *     (non-filer pays ~2× the filer rate)
 *   • bid security / performance guarantee are bank guarantees (% of value)
 *   • mobilization advance is cash paid up-front by the client
 */
export function computeBid(project: Project): BidResult {
  const direct = directCost(project.lineItems);

  let running = direct;
  const markupLines: MarkupLine[] = MARKUP_ORDER.map(({ key, label }) => {
    const rate = project.markups[key];
    const base = running;
    const amount = base * rate;
    running += amount;
    return { key, label, rate, base, amount };
  });

  const bidTotal = running;
  const salesTaxLine = markupLines.find((l) => l.key === "salesTax");
  const salesTaxAmount = salesTaxLine?.amount ?? 0;
  const worksValue = bidTotal - salesTaxAmount;
  const totalMarkup = bidTotal - direct;

  const profitAmount = markupLines.find((l) => l.key === "profit")?.amount ?? 0;
  const contingencyAmount =
    markupLines.find((l) => l.key === "contingency")?.amount ?? 0;

  const lv = project.levies;
  const effectiveWHT = lv.isFiler
    ? lv.incomeTaxWithholding
    : lv.incomeTaxWithholding * 2; // non-filer pays roughly double
  const incomeTaxAmount = bidTotal * effectiveWHT;

  return {
    directCost: direct,
    markupLines,
    worksValue,
    salesTaxAmount,
    totalMarkup,
    bidTotal,
    costPerSft: project.area > 0 ? bidTotal / project.area : 0,
    profitAmount,
    netMargin: bidTotal > 0 ? profitAmount / bidTotal : 0,
    contingencyAmount,
    overrunBuffer: direct > 0 ? (contingencyAmount + profitAmount) / direct : 0,
    incomeTaxAmount,
    netReceipt: bidTotal - incomeTaxAmount,
    bidSecurityAmount: bidTotal * lv.bidSecurity,
    performanceGuaranteeAmount: bidTotal * lv.performanceGuarantee,
    mobilizationAmount: bidTotal * lv.mobilizationAdvance,
  };
}

/** Convenience: bid total for a project (used in list / portfolio views). */
export function bidTotal(project: Project): number {
  return computeBid(project).bidTotal;
}

/** True when a bid exceeds the contractor's PEC category ceiling. */
export function exceedsPecCeiling(value: number, ceiling: number): boolean {
  return value > ceiling;
}
