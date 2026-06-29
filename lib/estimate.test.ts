// Run with:  npm test   (node --import tsx --test)
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  computeBid,
  costByCategory,
  costByTrade,
  directCost,
  extendedCost,
  keyMaterialTotals,
  unitTotal,
} from "./estimate.ts";
import type { LineItem, Project } from "./types.ts";

const line = (
  tradeId: string,
  quantity: number,
  cost: [number, number, number],
  keyMaterials?: object,
): LineItem =>
  ({
    id: Math.random().toString(36),
    tradeId,
    itemCode: "X-01",
    description: "x",
    quantity,
    unit: "Each",
    cost: { material: cost[0], labor: cost[1], equipment: cost[2] },
    keyMaterials,
  }) as LineItem;

test("unitTotal and extendedCost (material+labor+equipment)", () => {
  const li = line("concrete", 10, [3, 2, 1]); // unit = 6
  assert.equal(unitTotal(li.cost), 6);
  assert.equal(extendedCost(li), 60);
});

test("directCost sums all extended costs", () => {
  const items = [line("concrete", 10, [1, 0, 0]), line("paint", 5, [0, 2, 0])];
  assert.equal(directCost(items), 10 + 10);
});

test("costByTrade rolls up and sorts by canonical trade order", () => {
  const items = [line("paint", 1, [25, 0, 0]), line("concrete", 1, [75, 0, 0])];
  const roll = costByTrade(items);
  assert.equal(roll[0].tradeId, "concrete"); // concrete precedes paint in order
  assert.equal(roll[0].amount, 75);
  assert.equal(roll[0].share, 0.75);
});

test("costByCategory splits the three buckets", () => {
  const cats = costByCategory([line("concrete", 2, [1, 2, 3])]);
  assert.deepEqual(cats, { material: 2, labor: 4, equipment: 6 });
});

test("keyMaterialTotals roll up procurement quantities", () => {
  const items = [
    line("concrete", 100, [0, 0, 0], { cementBags: 0.18 }),
    line("reinforcement", 10, [0, 0, 0], { steelTons: 1 }),
  ];
  const t = keyMaterialTotals(items);
  assert.equal(t.cementBags, 18); // 100 × 0.18
  assert.equal(t.steelTons, 10); // 10 × 1
});

test("markup waterfall compounds, sales tax sits on works value", () => {
  const project = {
    id: "t",
    name: "t",
    client: "t",
    location: "t",
    province: "punjab",
    type: "commercial",
    csrSchedule: "Punjab CSR 2022",
    contractorId: "c",
    area: 1000,
    durationMonths: 1,
    startDate: "2026-01-01",
    status: "draft",
    markups: { overhead: 0.1, profit: 0.1, contingency: 0, salesTax: 0.16 },
    levies: {
      incomeTaxWithholding: 0.075,
      isFiler: true,
      bidSecurity: 0.02,
      performanceGuarantee: 0.1,
      mobilizationAdvance: 0.15,
    },
    lineItems: [line("concrete", 1, [1000, 0, 0])], // direct = 1000
    updatedAt: "2026-01-01",
  } as Project;

  const bid = computeBid(project);
  assert.equal(bid.directCost, 1000);
  // overhead 1000×.1 = 100 → 1100 ; profit 1100×.1 = 110 → 1210 (compounded)
  assert.equal(bid.markupLines[0].amount, 100);
  assert.equal(bid.markupLines[1].amount, 110);
  assert.equal(bid.worksValue, 1210);
  // sales tax 16% on works value 1210 = 193.6 → bid 1403.6
  assert.equal(Math.round(bid.salesTaxAmount * 10) / 10, 193.6);
  assert.equal(Math.round(bid.bidTotal * 10) / 10, 1403.6);
  // filer income tax 7.5% of bid withheld
  assert.equal(Math.round(bid.incomeTaxAmount * 10) / 10, 105.3);
});

test("non-filer withholding is ~double the filer rate", () => {
  const base = {
    id: "t", name: "t", client: "t", location: "t", province: "punjab",
    type: "commercial", csrSchedule: "Punjab CSR 2022", contractorId: "c",
    area: 1, durationMonths: 1, startDate: "2026-01-01", status: "draft",
    markups: { overhead: 0, profit: 0, contingency: 0, salesTax: 0 },
    lineItems: [line("concrete", 1, [1000, 0, 0])], updatedAt: "2026-01-01",
  };
  const filer = computeBid({ ...base, levies: { incomeTaxWithholding: 0.075, isFiler: true, bidSecurity: 0, performanceGuarantee: 0, mobilizationAdvance: 0 } } as Project);
  const nonFiler = computeBid({ ...base, levies: { incomeTaxWithholding: 0.075, isFiler: false, bidSecurity: 0, performanceGuarantee: 0, mobilizationAdvance: 0 } } as Project);
  assert.equal(nonFiler.incomeTaxAmount, filer.incomeTaxAmount * 2);
});
