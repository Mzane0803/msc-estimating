import { test } from "node:test";
import assert from "node:assert/strict";
import {
  decompose,
  escalate,
  defaultAssumptions,
  projectEscalation,
  rateFor,
} from "./escalation.ts";
import type { Project } from "./types.ts";

function proj(): Project {
  return {
    id: "p", name: "p", client: "c", location: "Lahore", province: "punjab",
    type: "commercial", csrSchedule: "Punjab CSR 2022", contractorId: "ctr",
    area: 1000, durationMonths: 12, startDate: "2026-01-01", status: "submitted",
    markups: { overhead: 0.1, profit: 0.1, contingency: 0, salesTax: 0.16 },
    levies: { incomeTaxWithholding: 0.075, isFiler: true, bidSecurity: 0, performanceGuarantee: 0, mobilizationAdvance: 0 },
    lineItems: [
      { id: "a", tradeId: "reinforcement", itemCode: "S", description: "steel", quantity: 10, unit: "Ton", cost: { material: 100, labor: 0, equipment: 0 } },
      { id: "b", tradeId: "concrete", itemCode: "C", description: "rcc", quantity: 100, unit: "Cft", cost: { material: 10, labor: 5, equipment: 2 } },
    ],
    updatedAt: "2026-01-01",
  };
}

test("decompose maps trade material to drivers", () => {
  const c = decompose(proj());
  assert.equal(c.steelMat, 1000); // 10 × 100
  assert.equal(c.cementMat, 1000); // 100 × 10
  assert.equal(c.labor, 500);
  assert.equal(c.equipment, 200);
});

test("escalate at year 0 returns the base composition sum", () => {
  const a = defaultAssumptions(2026);
  const c = decompose(proj());
  const base = c.labor + c.equipment + c.steelMat + c.cementMat + c.otherMat;
  assert.equal(escalate(c, 0, a), base);
});

test("escalation grows cost over time", () => {
  const a = defaultAssumptions(2026);
  const c = decompose(proj());
  assert.ok(escalate(c, 3, a) > escalate(c, 0, a));
});

test("shock scenario escalates FX harder than base", () => {
  const base = defaultAssumptions(2026);
  const shock = { ...base, scenario: "shock" as const };
  assert.ok(rateFor(shock, "fx") > rateFor(base, "fx") * 2);
});

test("projectEscalation spreads cost across active years", () => {
  const a = defaultAssumptions(2026);
  const e = projectEscalation(proj(), a);
  // 12 months from Jan 2026 → entirely within 2026
  assert.equal(e.byYear.length, 1);
  assert.equal(e.byYear[0].year, 2026);
  assert.ok(e.nominalCost >= e.baseCost);
});
