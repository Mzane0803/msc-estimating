import type {
  Contractor,
  KeyMaterials,
  LineItem,
  Levies,
  Markups,
  Project,
  RateItem,
  TradeId,
  Unit,
} from "./types";
import type { CSRSchedule } from "./trades";

// ----------------------------------------------------------------------------
// Seed data (PKR). Realistic mid-2020s Pakistani rates. This is what the store
// loads into localStorage on first run; thereafter the user's edits persist.
// ----------------------------------------------------------------------------

let _id = 0;
const sid = (p: string) => `${p}_${(++_id).toString(36)}`;

/** BOQ line builder. cost = [material, labor, equipment] per unit. */
function boq(
  tradeId: TradeId,
  itemCode: string,
  description: string,
  quantity: number,
  unit: Unit,
  [material, labor, equipment]: [number, number, number],
  keyMaterials?: KeyMaterials,
): LineItem {
  return {
    id: sid("li"),
    tradeId,
    itemCode,
    description,
    quantity,
    unit,
    cost: { material, labor, equipment },
    keyMaterials,
  };
}

// --- Flagship project: Gulberg Corporate Tower, Lahore (~46,000 Sft) ---------
const towerBOQ: LineItem[] = [
  // Earthwork
  boq("earthwork", "E-01", "Excavation in foundation, ordinary soil", 86000, "Cft", [0, 22, 14]),
  boq("earthwork", "E-04", "Earth filling & compaction in plinth", 52000, "Cft", [8, 9, 6]),
  boq("earthwork", "E-09", "Anti-termite treatment", 46000, "Sft", [12, 6, 0]),

  // PCC / RCC
  boq("concrete", "C-02", "PCC 1:4:8 under foundations", 4200, "Cft", [165, 35, 12], { cementBags: 0.045, sandCft: 0.45, aggregateCft: 0.9 }),
  boq("concrete", "C-11", "RCC 1:2:4 in foundations & columns", 18500, "Cft", [355, 95, 28], { cementBags: 0.18, sandCft: 0.45, aggregateCft: 0.9 }),
  boq("concrete", "C-14", "RCC 1:2:4 in slabs & beams", 22000, "Cft", [355, 110, 30], { cementBags: 0.18, sandCft: 0.45, aggregateCft: 0.9 }),
  boq("concrete", "C-19", "RCC in staircases & landings", 1400, "Cft", [355, 130, 25], { cementBags: 0.18, sandCft: 0.45, aggregateCft: 0.9 }),

  // Reinforcement
  boq("reinforcement", "S-01", "Deformed steel reinforcement, Grade-60", 320, "Ton", [280000, 22000, 4000], { steelTons: 1 }),

  // Brickwork / Blockwork
  boq("masonry", "M-03", "1st class brick masonry 1:4 in foundation", 6800, "Cft", [280, 45, 0], { bricks: 13.5, cementBags: 0.022, sandCft: 0.2 }),
  boq("masonry", "M-07", "1st class brick masonry 1:6 in superstructure", 28000, "Cft", [280, 42, 0], { bricks: 13.5, cementBags: 0.018, sandCft: 0.2 }),
  boq("masonry", "M-12", "4\" concrete block partition walls", 12000, "Sft", [95, 28, 0]),

  // Plaster
  boq("plaster", "P-02", "Cement plaster 1:4, internal (½\")", 92000, "Sft", [22, 18, 0], { cementBags: 0.012, sandCft: 0.08 }),
  boq("plaster", "P-05", "Cement plaster 1:4, external (¾\")", 38000, "Sft", [30, 24, 0], { cementBags: 0.016, sandCft: 0.1 }),

  // Flooring / Tiling
  boq("flooring", "F-01", "PCC 1:4:8 floor base", 46000, "Sft", [38, 12, 0], { cementBags: 0.01 }),
  boq("flooring", "F-08", "Porcelain floor tiles, glazed", 38000, "Sft", [240, 95, 0], { cementBags: 0.02 }),
  boq("flooring", "F-12", "Ceramic wall tiles, washrooms", 9200, "Sft", [210, 110, 0]),
  boq("flooring", "F-20", "Imported marble flooring, lobby", 3400, "Sft", [650, 180, 0]),

  // Wood & Joinery
  boq("joinery", "W-04", "Kitchen & vanity cabinets, laminated", 320, "Rft", [4200, 1600, 0]),
  boq("joinery", "W-09", "Built-in wardrobes", 1800, "Sft", [850, 320, 0]),

  // Doors / Windows
  boq("openings", "D-02", "Solid flush door with chowkat, complete", 88, "Each", [22000, 4500, 0]),
  boq("openings", "D-11", "Powder-coated aluminum windows with glass", 6800, "Sft", [1450, 280, 0]),
  boq("openings", "D-15", "Aluminum / glass storefront glazing", 3400, "Sft", [2200, 350, 0]),
  boq("openings", "D-21", "Main entrance steel & glass door", 2, "Each", [185000, 25000, 0]),

  // Paint
  boq("paint", "PT-02", "Emulsion paint, internal (3 coats)", 92000, "Sft", [24, 28, 0]),
  boq("paint", "PT-06", "Weather-shield paint, external", 38000, "Sft", [42, 36, 0]),
  boq("paint", "PT-11", "Synthetic enamel on grills & steel", 2400, "Rft", [35, 45, 0]),

  // Plumbing & Sanitary
  boq("plumbing", "PL-01", "Internal water supply & drainage system", 46000, "Sft", [95, 55, 0]),
  boq("plumbing", "PL-09", "Sanitary fixtures (WC, basin, fittings)", 96, "Each", [32000, 6500, 0]),
  boq("plumbing", "PL-14", "Underground tank, pumps & hydro-pneumatic", 1, "Job", [1450000, 180000, 60000]),
  boq("plumbing", "PL-20", "External sewerage, manholes & disposal", 1850, "Rft", [380, 220, 0]),

  // Electrical
  boq("electrical", "EL-01", "Concealed wiring, conduiting & accessories", 46000, "Sft", [165, 85, 0]),
  boq("electrical", "EL-08", "Main LT panel, DBs & distribution", 1, "Job", [2200000, 350000, 0]),
  boq("electrical", "EL-12", "Light fixtures, fans & devices", 420, "Each", [4800, 1200, 0]),
  boq("electrical", "EL-19", "Earthing & lightning protection", 1, "Job", [480000, 120000, 0]),

  // External Development
  boq("external", "X-02", "Boundary wall with plaster & coping", 620, "Rft", [3200, 1400, 0], { bricks: 9, cementBags: 0.04 }),
  boq("external", "X-07", "Tuff-tile paving, driveway & car park", 12000, "Sft", [165, 55, 0]),
  boq("external", "X-12", "Landscaping & soft areas", 4000, "Sft", [85, 65, 0]),
  boq("external", "X-18", "External electrification & pole lights", 1, "Job", [650000, 150000, 0]),
];

const STD_MARKUPS: Markups = {
  overhead: 0.08,
  profit: 0.1,
  contingency: 0.04,
  salesTax: 0.16,
};

const STD_LEVIES: Levies = {
  incomeTaxWithholding: 0.075,
  isFiler: true,
  bidSecurity: 0.02,
  performanceGuarantee: 0.1,
  mobilizationAdvance: 0.15,
};

// Lightweight trade-level lump sums (PKR) for the rest of the portfolio.
function lumps(
  rows: [TradeId, string, string, number, KeyMaterials?][],
): LineItem[] {
  return rows.map(([trade, code, desc, amount, km]) =>
    boq(trade, code, desc, 1, "Job", [amount, 0, 0], km),
  );
}

export const SEED_CONTRACTORS: Contractor[] = [
  { id: "ctr_falcon", name: "Falcon Builders (Pvt) Ltd", pecCategory: "C-A", isFiler: true, ntn: "1234567-8" },
  { id: "ctr_skyline", name: "Skyline Construction Co.", pecCategory: "C-2", isFiler: true, ntn: "2345678-9" },
  { id: "ctr_reliable", name: "Reliable Engineers & Contractors", pecCategory: "C-4", isFiler: false, ntn: "3456789-0" },
];

export const SEED_PROJECTS: Project[] = [
  {
    id: "gulberg-corporate-tower",
    name: "Gulberg Corporate Tower",
    client: "Meridian Developers",
    location: "Gulberg III, Lahore",
    province: "punjab",
    type: "commercial",
    csrSchedule: "Punjab CSR 2022",
    contractorId: "ctr_falcon",
    area: 46000,
    landArea: 20,
    landUnit: "Marla",
    durationMonths: 14,
    startDate: "2026-02-01",
    status: "submitted",
    markups: STD_MARKUPS,
    levies: STD_LEVIES,
    lineItems: towerBOQ,
    updatedAt: "2026-06-22",
  },
  {
    id: "dha-medical-complex",
    name: "DHA Medical Complex",
    client: "Pearl Healthcare",
    location: "DHA Phase 6, Karachi",
    province: "sindh",
    type: "commercial",
    csrSchedule: "Sindh CSR 2023",
    contractorId: "ctr_skyline",
    area: 38000,
    durationMonths: 12,
    startDate: "2025-09-01",
    status: "won",
    markups: { overhead: 0.085, profit: 0.105, contingency: 0.035, salesTax: 0.15 },
    levies: STD_LEVIES,
    lineItems: lumps([
      ["earthwork", "E-LS", "Earthwork & site preparation", 4200000],
      ["concrete", "C-LS", "PCC / RCC structure", 41500000, { cementBags: 9800, sandCft: 24000, aggregateCft: 48000 }],
      ["reinforcement", "S-LS", "Steel reinforcement (210 Ton)", 61000000, { steelTons: 210 }],
      ["masonry", "M-LS", "Brick & block masonry", 14200000, { bricks: 620000 }],
      ["flooring", "F-LS", "Flooring, tiling & finishes", 22400000],
      ["plumbing", "PL-LS", "Plumbing, sanitary & medical gas", 19800000],
      ["electrical", "EL-LS", "Electrical & low-voltage systems", 16400000],
    ]),
    updatedAt: "2026-05-30",
  },
  {
    id: "bahria-residences-b2",
    name: "Bahria Residences — Block 2",
    client: "Northwind Living",
    location: "Bahria Town, Rawalpindi",
    province: "punjab",
    type: "residential",
    csrSchedule: "Punjab CSR 2022",
    contractorId: "ctr_skyline",
    area: 72000,
    durationMonths: 18,
    startDate: "2026-04-01",
    status: "draft",
    markups: { overhead: 0.075, profit: 0.09, contingency: 0.05, salesTax: 0.16 },
    levies: STD_LEVIES,
    lineItems: lumps([
      ["earthwork", "E-LS", "Earthwork & filling", 6800000],
      ["concrete", "C-LS", "RCC frame & slabs", 58500000, { cementBags: 14200, sandCft: 34000, aggregateCft: 68000 }],
      ["reinforcement", "S-LS", "Steel reinforcement (290 Ton)", 84000000, { steelTons: 290 }],
      ["masonry", "M-LS", "Brick masonry & partitions", 28700000, { bricks: 1180000 }],
      ["flooring", "F-LS", "Flooring & finishes", 33200000],
      ["openings", "D-LS", "Doors, windows & glazing", 15400000],
      ["plumbing", "PL-LS", "Plumbing & sanitary", 17800000],
      ["electrical", "EL-LS", "Electrical works", 14900000],
    ]),
    updatedAt: "2026-06-18",
  },
  {
    id: "m9-interchange",
    name: "M-9 Motorway Interchange",
    client: "National Highway Authority",
    location: "Hyderabad, Sindh",
    province: "sindh",
    type: "civil",
    csrSchedule: "MES Schedule",
    contractorId: "ctr_falcon",
    area: 24000,
    durationMonths: 22,
    startDate: "2025-03-01",
    status: "lost",
    markups: { overhead: 0.09, profit: 0.08, contingency: 0.06, salesTax: 0.15 },
    levies: { ...STD_LEVIES, performanceGuarantee: 0.1, mobilizationAdvance: 0.2 },
    lineItems: lumps([
      ["earthwork", "E-LS", "Earthwork, embankment & sub-grade", 78000000],
      ["concrete", "C-LS", "Structural concrete & deck", 142000000, { cementBags: 34000, sandCft: 82000, aggregateCft: 164000 }],
      ["reinforcement", "S-LS", "Steel reinforcement & bearings (640 Ton)", 188000000, { steelTons: 640 }],
      ["external", "X-LS", "Asphalt, road furniture & lighting", 96000000],
    ]),
    updatedAt: "2026-04-11",
  },
  {
    id: "korangi-logistics-park",
    name: "Korangi Logistics Park",
    client: "Cascade Industrial",
    location: "Korangi, Karachi",
    province: "sindh",
    type: "industrial",
    csrSchedule: "Sindh CSR 2023",
    contractorId: "ctr_reliable",
    area: 120000,
    durationMonths: 16,
    startDate: "2026-07-01",
    status: "submitted",
    markups: { overhead: 0.07, profit: 0.085, contingency: 0.035, salesTax: 0.15 },
    levies: STD_LEVIES,
    lineItems: lumps([
      ["earthwork", "E-LS", "Earthwork, filling & paving sub-base", 34000000],
      ["concrete", "C-LS", "Tilt-up panels, slab & RCC", 88000000, { cementBags: 21000, sandCft: 50000, aggregateCft: 100000 }],
      ["reinforcement", "S-LS", "Structural steel & rebar (520 Ton)", 152000000, { steelTons: 520 }],
      ["external", "X-LS", "Yard paving, drainage & external works", 64000000],
      ["electrical", "EL-LS", "Electrical & yard lighting", 28000000],
    ]),
    updatedAt: "2026-06-25",
  },
  {
    id: "peshawar-civic-center",
    name: "Peshawar Civic Center",
    client: "City District Government",
    location: "University Road, Peshawar",
    province: "kpk",
    type: "commercial",
    csrSchedule: "KPK CSR 2022",
    contractorId: "ctr_skyline",
    area: 54000,
    durationMonths: 15,
    startDate: "2027-01-01",
    status: "draft",
    markups: { overhead: 0.082, profit: 0.095, contingency: 0.045, salesTax: 0.15 },
    levies: STD_LEVIES,
    lineItems: lumps([
      ["earthwork", "E-LS", "Earthwork & preparation", 5400000],
      ["concrete", "C-LS", "RCC structure", 48000000, { cementBags: 11500, sandCft: 28000, aggregateCft: 56000 }],
      ["reinforcement", "S-LS", "Steel reinforcement (245 Ton)", 70500000, { steelTons: 245 }],
      ["masonry", "M-LS", "Stone & brick masonry", 21600000, { bricks: 720000 }],
      ["openings", "D-LS", "Curtain wall, doors & windows", 24800000],
      ["flooring", "F-LS", "Architectural finishes", 26400000],
      ["electrical", "EL-LS", "Electrical & AV systems", 17300000],
    ]),
    updatedAt: "2026-06-12",
  },
];

// --- Rate Library -----------------------------------------------------------
function rate(
  tradeId: TradeId,
  itemCode: string,
  description: string,
  unit: Unit,
  [material, labor, equipment]: [number, number, number],
  schedule: CSRSchedule,
  keyMaterials?: KeyMaterials,
): RateItem {
  return {
    id: sid("rate"),
    tradeId,
    itemCode,
    description,
    unit,
    cost: { material, labor, equipment },
    keyMaterials,
    schedule,
  };
}

export const SEED_RATES: RateItem[] = [
  rate("earthwork", "E-01", "Excavation in foundation, ordinary soil", "Cft", [0, 22, 14], "Punjab CSR 2022"),
  rate("earthwork", "E-04", "Earth filling & compaction in plinth", "Cft", [8, 9, 6], "Punjab CSR 2022"),
  rate("earthwork", "E-09", "Anti-termite treatment", "Sft", [12, 6, 0], "Punjab CSR 2022"),
  rate("concrete", "C-02", "PCC 1:4:8 under foundations", "Cft", [165, 35, 12], "Punjab CSR 2022", { cementBags: 0.045, sandCft: 0.45, aggregateCft: 0.9 }),
  rate("concrete", "C-11", "RCC 1:2:4 in foundations & columns", "Cft", [355, 95, 28], "Punjab CSR 2022", { cementBags: 0.18, sandCft: 0.45, aggregateCft: 0.9 }),
  rate("concrete", "C-14", "RCC 1:2:4 in slabs & beams", "Cft", [355, 110, 30], "Punjab CSR 2022", { cementBags: 0.18, sandCft: 0.45, aggregateCft: 0.9 }),
  rate("reinforcement", "S-01", "Deformed steel reinforcement, Grade-60", "Ton", [280000, 22000, 4000], "Punjab CSR 2022", { steelTons: 1 }),
  rate("masonry", "M-03", "1st class brick masonry 1:4 in foundation", "Cft", [280, 45, 0], "Punjab CSR 2022", { bricks: 13.5, cementBags: 0.022, sandCft: 0.2 }),
  rate("masonry", "M-07", "1st class brick masonry 1:6 in superstructure", "Cft", [280, 42, 0], "Punjab CSR 2022", { bricks: 13.5, cementBags: 0.018, sandCft: 0.2 }),
  rate("masonry", "M-12", "4\" concrete block partition walls", "Sft", [95, 28, 0], "Punjab CSR 2022"),
  rate("plaster", "P-02", "Cement plaster 1:4, internal (½\")", "Sft", [22, 18, 0], "Punjab CSR 2022", { cementBags: 0.012, sandCft: 0.08 }),
  rate("plaster", "P-05", "Cement plaster 1:4, external (¾\")", "Sft", [30, 24, 0], "Punjab CSR 2022", { cementBags: 0.016, sandCft: 0.1 }),
  rate("flooring", "F-08", "Porcelain floor tiles, glazed", "Sft", [240, 95, 0], "Punjab CSR 2022", { cementBags: 0.02 }),
  rate("flooring", "F-12", "Ceramic wall tiles, washrooms", "Sft", [210, 110, 0], "Punjab CSR 2022"),
  rate("flooring", "F-20", "Imported marble flooring", "Sft", [650, 180, 0], "Punjab CSR 2022"),
  rate("joinery", "W-04", "Kitchen & vanity cabinets, laminated", "Rft", [4200, 1600, 0], "Punjab CSR 2022"),
  rate("joinery", "W-09", "Built-in wardrobes", "Sft", [850, 320, 0], "Punjab CSR 2022"),
  rate("openings", "D-02", "Solid flush door with chowkat, complete", "Each", [22000, 4500, 0], "Punjab CSR 2022"),
  rate("openings", "D-11", "Powder-coated aluminum windows with glass", "Sft", [1450, 280, 0], "Punjab CSR 2022"),
  rate("openings", "D-15", "Aluminum / glass storefront glazing", "Sft", [2200, 350, 0], "Punjab CSR 2022"),
  rate("paint", "PT-02", "Emulsion paint, internal (3 coats)", "Sft", [24, 28, 0], "Punjab CSR 2022"),
  rate("paint", "PT-06", "Weather-shield paint, external", "Sft", [42, 36, 0], "Punjab CSR 2022"),
  rate("plumbing", "PL-01", "Internal water supply & drainage", "Sft", [95, 55, 0], "Punjab CSR 2022"),
  rate("plumbing", "PL-09", "Sanitary fixtures (WC, basin, fittings)", "Each", [32000, 6500, 0], "Punjab CSR 2022"),
  rate("electrical", "EL-01", "Concealed wiring, conduiting & accessories", "Sft", [165, 85, 0], "Punjab CSR 2022"),
  rate("electrical", "EL-12", "Light fixtures, fans & devices", "Each", [4800, 1200, 0], "Punjab CSR 2022"),
  rate("external", "X-07", "Tuff-tile paving, driveway & car park", "Sft", [165, 55, 0], "Punjab CSR 2022"),
  rate("external", "X-02", "Boundary wall with plaster & coping", "Rft", [3200, 1400, 0], "Punjab CSR 2022", { bricks: 9, cementBags: 0.04 }),
];
