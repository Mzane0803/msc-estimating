// ============================================================================
// escalation.ts — multi-year cost escalation engine. PURE functions.
//
// Restates a project's cost in nominal (escalated) and real terms across the
// years it runs, driven by per-material annual indices plus a separate rupee
// devaluation on the import-linked share of materials.
// ============================================================================

import type {
  EscalationAssumptions,
  EscalationIndex,
  EscalationScenario,
  Project,
} from "./types";
import { computeBid, costByCategory } from "./estimate";

// Pakistan-realistic defaults: steel & cement are the volatile ones.
export const DEFAULT_INDICES: EscalationIndex[] = [
  { key: "steel", label: "Steel / Rebar", annualPct: 0.18 },
  { key: "cement", label: "Cement", annualPct: 0.14 },
  { key: "fuel", label: "Fuel / Equipment", annualPct: 0.16 },
  { key: "labor", label: "Labor", annualPct: 0.12 },
  { key: "cpi", label: "General CPI", annualPct: 0.12 },
  { key: "fx", label: "PKR Devaluation (FX)", annualPct: 0.1 },
];

export function defaultAssumptions(baseYear: number): EscalationAssumptions {
  return {
    baseYear,
    horizonYears: 6,
    indices: DEFAULT_INDICES.map((i) => ({ ...i })),
    importedShare: 0.15,
    scenario: "base",
  };
}

/**
 * Scenario multipliers applied to the annual index rates.
 *   base  — as entered
 *   high  — broad inflation 1.5× hotter
 *   shock — devaluation shock: FX 2.5×, imported-driven steel/cement 1.4×
 */
function scenarioRate(index: EscalationIndex, scenario: EscalationScenario): number {
  const p = index.annualPct;
  if (scenario === "high") return p * 1.5;
  if (scenario === "shock") {
    if (index.key === "fx") return p * 2.5;
    if (index.key === "steel" || index.key === "cement") return p * 1.4;
    return p * 1.2;
  }
  return p;
}

export function rateFor(
  a: EscalationAssumptions,
  key: EscalationIndex["key"],
): number {
  const idx = a.indices.find((i) => i.key === key);
  return idx ? scenarioRate(idx, a.scenario) : 0;
}

/** Compounded growth factor for an index over `years`. */
function factor(rate: number, years: number): number {
  return Math.pow(1 + rate, years);
}

/** Cost composition mapped to escalation drivers (all in PKR). */
export interface Composition {
  labor: number;
  equipment: number;
  steelMat: number;
  cementMat: number;
  otherMat: number;
}

/**
 * Decompose a project's direct cost into driver buckets:
 * reinforcement material → steel, concrete material → cement, the rest of
 * material → other, plus total labor and equipment.
 */
export function decompose(project: Project): Composition {
  const cat = costByCategory(project.lineItems);
  // Approximate material-by-trade split using each trade's material share.
  const items = project.lineItems;
  const matOf = (tradeId: string) =>
    items
      .filter((i) => i.tradeId === tradeId)
      .reduce((s, i) => s + i.quantity * i.cost.material, 0);
  const steelMat = matOf("reinforcement");
  const cementMat = matOf("concrete");
  const otherMat = Math.max(cat.material - steelMat - cementMat, 0);
  return { labor: cat.labor, equipment: cat.equipment, steelMat, cementMat, otherMat };
}

/**
 * Escalate a composition `years` past the base year. The import-linked share
 * of material escalates by FX (devaluation) instead of its domestic index.
 */
export function escalate(
  comp: Composition,
  years: number,
  a: EscalationAssumptions,
): number {
  if (years <= 0)
    return comp.labor + comp.equipment + comp.steelMat + comp.cementMat + comp.otherMat;

  const imp = a.importedShare;
  const totalMat = comp.steelMat + comp.cementMat + comp.otherMat;
  const importedPortion = totalMat * imp;
  const fxF = factor(rateFor(a, "fx"), years);

  const domestic =
    comp.labor * factor(rateFor(a, "labor"), years) +
    comp.equipment * factor(rateFor(a, "fuel"), years) +
    comp.steelMat * (1 - imp) * factor(rateFor(a, "steel"), years) +
    comp.cementMat * (1 - imp) * factor(rateFor(a, "cement"), years) +
    comp.otherMat * (1 - imp) * factor(rateFor(a, "cpi"), years);

  return domestic + importedPortion * fxF;
}

/** Calendar year (integer) a project starts in. */
function startYear(project: Project): number {
  return new Date(project.startDate).getUTCFullYear();
}

export interface ProjectYearCost {
  year: number;
  weight: number; // share of the project's work done this year
  base: number; // un-escalated cost of that work
  nominal: number; // escalated to that year's prices
  real: number; // nominal deflated back to base-year rupees by CPI
}

/**
 * Spread a project's direct cost evenly across the months it is active, then
 * escalate each year's portion to that year's prices.
 */
export function projectYearlyCost(
  project: Project,
  a: EscalationAssumptions,
): ProjectYearCost[] {
  const comp = decompose(project);
  const base = project.lineItems.reduce(
    (s, i) => s + i.quantity * (i.cost.material + i.cost.labor + i.cost.equipment),
    0,
  );
  const start = startYear(project);
  const months = Math.max(project.durationMonths, 1);
  const startMonth = new Date(project.startDate).getUTCMonth(); // 0–11

  // Distribute months into calendar years.
  const perYearMonths = new Map<number, number>();
  for (let m = 0; m < months; m++) {
    const y = start + Math.floor((startMonth + m) / 12);
    perYearMonths.set(y, (perYearMonths.get(y) ?? 0) + 1);
  }

  const cpi = rateFor(a, "cpi");
  return [...perYearMonths.entries()]
    .sort((x, y) => x[0] - y[0])
    .map(([year, mo]) => {
      const weight = mo / months;
      const yearsFromBase = year - a.baseYear;
      const nominal = escalate(comp, yearsFromBase, a) * weight;
      const real = nominal / factor(cpi, Math.max(yearsFromBase, 0));
      return { year, weight, base: base * weight, nominal, real };
    });
}

export interface ProjectEscalation {
  projectId: string;
  name: string;
  baseCost: number;
  nominalCost: number; // total escalated cost across the project life
  realCost: number;
  byYear: ProjectYearCost[];
  /** Locked-in bid (fixed-price contract value). */
  lockedBid: number;
  /** Profit left after escalated costs vs the locked bid. */
  escalatedMargin: number;
}

export function projectEscalation(
  project: Project,
  a: EscalationAssumptions,
): ProjectEscalation {
  const byYear = projectYearlyCost(project, a);
  const baseCost = byYear.reduce((s, y) => s + y.base, 0);
  const nominalCost = byYear.reduce((s, y) => s + y.nominal, 0);
  const realCost = byYear.reduce((s, y) => s + y.real, 0);
  const lockedBid = computeBid(project).bidTotal;
  return {
    projectId: project.id,
    name: project.name,
    baseCost,
    nominalCost,
    realCost,
    byYear,
    lockedBid,
    escalatedMargin: lockedBid - nominalCost,
  };
}

export interface PortfolioYear {
  year: number;
  base: number;
  nominal: number;
  real: number;
}

/** Aggregate escalated cost by calendar year across many projects. */
export function portfolioByYear(
  projects: Project[],
  a: EscalationAssumptions,
): PortfolioYear[] {
  const acc = new Map<number, PortfolioYear>();
  for (const p of projects) {
    for (const y of projectYearlyCost(p, a)) {
      const e = acc.get(y.year) ?? { year: y.year, base: 0, nominal: 0, real: 0 };
      e.base += y.base;
      e.nominal += y.nominal;
      e.real += y.real;
      acc.set(y.year, e);
    }
  }
  return [...acc.values()].sort((x, y) => x.year - y.year);
}

/** Index price level (base = 100) for each driver across the horizon. */
export function indexTrends(
  a: EscalationAssumptions,
): { year: number; [k: string]: number }[] {
  const rows: { year: number; [k: string]: number }[] = [];
  for (let y = 0; y <= a.horizonYears; y++) {
    const row: { year: number; [k: string]: number } = { year: a.baseYear + y };
    for (const idx of a.indices) {
      row[idx.key] = 100 * factor(scenarioRate(idx, a.scenario), y);
    }
    rows.push(row);
  }
  return rows;
}

/** Portfolio profit erosion: locked bids vs escalated costs. */
export function portfolioMarginAtRisk(
  projects: Project[],
  a: EscalationAssumptions,
): { lockedBid: number; baseCost: number; escalatedCost: number; baseMargin: number; escalatedMargin: number } {
  let lockedBid = 0,
    baseCost = 0,
    escalatedCost = 0;
  for (const p of projects) {
    const e = projectEscalation(p, a);
    lockedBid += e.lockedBid;
    baseCost += e.baseCost;
    escalatedCost += e.nominalCost;
  }
  return {
    lockedBid,
    baseCost,
    escalatedCost,
    baseMargin: lockedBid - baseCost,
    escalatedMargin: lockedBid - escalatedCost,
  };
}
