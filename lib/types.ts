// Domain model — Pakistani BOQ estimating.
// Framework-agnostic so the localStorage repository (and a future API) serialize
// straight into these shapes.

import type { CSRSchedule, PecCategory, ProvinceId, TradeId, Unit } from "./trades";

export type { CSRSchedule, PecCategory, ProvinceId, TradeId, Unit };

export type ProjectType = "commercial" | "residential" | "civil" | "industrial";
export type ProjectStatus = "draft" | "submitted" | "won" | "lost" | "archived";

/** Per-unit cost. Material is the star in Pakistani estimating. */
export interface UnitCost {
  material: number;
  labor: number;
  equipment: number;
}

export type CostCategory = keyof UnitCost;

/**
 * Quantity of the key procurement materials consumed PER UNIT of a BOQ item.
 * Summed across the BOQ to tell the contractor how much cement/steel/brick to buy.
 */
export interface KeyMaterials {
  cementBags?: number; // 50kg bags
  steelTons?: number;
  bricks?: number;
  sandCft?: number;
  aggregateCft?: number;
}

export type KeyMaterialId = keyof KeyMaterials;

/** A BOQ line item, priced against the rate library / CSR. */
export interface LineItem {
  id: string;
  tradeId: TradeId;
  /** CSR / rate-library reference, e.g. "06-15-a". */
  itemCode: string;
  description: string;
  quantity: number;
  unit: Unit;
  cost: UnitCost;
  keyMaterials?: KeyMaterials;
}

/**
 * The four lines that COMPOUND to build the submitted bid (decimal fractions).
 * Order: overhead → profit → contingency → salesTax.
 */
export interface Markups {
  overhead: number;
  profit: number;
  contingency: number;
  salesTax: number; // PRA/SRB sales tax on services, added to the works value
}

/**
 * Statutory levies / securities computed off the bid but NOT part of the works
 * price. Only income-tax withholding changes the contractor's net receipt.
 */
export interface Levies {
  incomeTaxWithholding: number; // % of contract value, deducted by client
  isFiler: boolean; // filer pays the lower withholding rate
  bidSecurity: number; // % of bid (guarantee)
  performanceGuarantee: number; // % of contract (guarantee)
  mobilizationAdvance: number; // % of contract (cash advance in)
}

/** A contractor entity — gates biddable project value via PEC category. */
export interface Contractor {
  id: string;
  name: string;
  pecCategory: PecCategory;
  isFiler: boolean;
  ntn?: string;
}

export interface Project {
  id: string;
  name: string;
  client: string;
  location: string;
  province: ProvinceId;
  type: ProjectType;
  csrSchedule: CSRSchedule;
  contractorId: string;
  /** Covered area, in Sft (the Rs/Sft denominator). */
  area: number;
  /** Optional land area for context. */
  landArea?: number;
  landUnit?: "Marla" | "Kanal";
  durationMonths: number;
  /** ISO date — drives the portfolio timeline & escalation horizon. */
  startDate: string;
  status: ProjectStatus;
  markups: Markups;
  levies: Levies;
  lineItems: LineItem[];
  updatedAt: string;
}

/** A maintainable master unit rate (the Rate Library row). */
export interface RateItem {
  id: string;
  tradeId: TradeId;
  itemCode: string;
  description: string;
  unit: Unit;
  cost: UnitCost;
  keyMaterials?: KeyMaterials;
  schedule: CSRSchedule;
}

// --- Escalation (multi-year module) ----------------------------------------
export type EscalationScenario = "base" | "high" | "shock";

/** A named cost driver escalated at an annual % over the horizon. */
export interface EscalationIndex {
  key: "steel" | "cement" | "fuel" | "labor" | "cpi" | "fx";
  label: string;
  /** Annual escalation, decimal fraction (0.18 === 18%). */
  annualPct: number;
}

/** The full escalation assumption set the engine runs against. */
export interface EscalationAssumptions {
  baseYear: number;
  horizonYears: number;
  indices: EscalationIndex[];
  /** Share of a project's material cost that is import-linked (FX-exposed). */
  importedShare: number;
  scenario: EscalationScenario;
}
