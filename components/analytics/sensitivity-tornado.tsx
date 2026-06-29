"use client";

import { useMemo } from "react";
import {
  Bar,
  BarChart,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { LineItem, Project } from "@/lib/types";
import { computeBid } from "@/lib/estimate";
import { formatPKR, pkrShortBare } from "@/lib/format";
import { CHART, ChartTooltip, tickStyle } from "./chart-kit";

const SWING = 0.15;

type DriverKey = "steel" | "cement" | "labor" | "profit";

interface DriverDef {
  key: DriverKey;
  label: string;
}

const DRIVERS: DriverDef[] = [
  { key: "steel", label: "Steel price" },
  { key: "cement", label: "Cement price" },
  { key: "labor", label: "Labor rate" },
  { key: "profit", label: "Profit %" },
];

/** Clone a project with one driver scaled by `factor` (1±0.15). */
function flexProject(base: Project, driver: DriverKey, factor: number): Project {
  const clone: Project = structuredClone(base);
  switch (driver) {
    case "steel":
      clone.lineItems = clone.lineItems.map((li: LineItem) =>
        li.tradeId === "reinforcement"
          ? { ...li, cost: { ...li.cost, material: li.cost.material * factor } }
          : li,
      );
      break;
    case "cement":
      clone.lineItems = clone.lineItems.map((li: LineItem) =>
        li.tradeId === "concrete"
          ? { ...li, cost: { ...li.cost, material: li.cost.material * factor } }
          : li,
      );
      break;
    case "labor":
      clone.lineItems = clone.lineItems.map((li: LineItem) => ({
        ...li,
        cost: { ...li.cost, labor: li.cost.labor * factor },
      }));
      break;
    case "profit":
      clone.markups = { ...clone.markups, profit: clone.markups.profit * factor };
      break;
  }
  return clone;
}

interface TornadoRow {
  key: DriverKey;
  label: string;
  low: number; // bidTotal at −15%
  high: number; // bidTotal at +15%
  /** Signed offsets from base (for the floating-bar geometry). */
  lowOffset: number;
  highOffset: number;
  swing: number;
}

/**
 * Chart 5 — Sensitivity / tornado. Swings bidTotal as each driver moves ±15%
 * (clone project + recompute). Bars span from the base bid; sorted by total
 * swing.
 */
export function SensitivityTornado({ project }: { project: Project }) {
  const base = useMemo(() => computeBid(project).bidTotal, [project]);

  const rows = useMemo<TornadoRow[]>(() => {
    return DRIVERS.map((d) => {
      const low = computeBid(flexProject(project, d.key, 1 - SWING)).bidTotal;
      const high = computeBid(flexProject(project, d.key, 1 + SWING)).bidTotal;
      return {
        key: d.key,
        label: d.label,
        low,
        high,
        lowOffset: low - base,
        highOffset: high - base,
        swing: Math.abs(high - low),
      };
    }).sort((a, b) => b.swing - a.swing);
  }, [project, base]);

  // Symmetric-ish domain around base.
  const maxAbs = rows.reduce(
    (m, r) => Math.max(m, Math.abs(r.lowOffset), Math.abs(r.highOffset)),
    0,
  );
  const pad = maxAbs * 1.15 || 1;

  return (
    <div className="h-[240px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          layout="vertical"
          data={rows}
          stackOffset="sign"
          margin={{ top: 4, right: 12, bottom: 4, left: 4 }}
          barCategoryGap="30%"
        >
          <XAxis
            type="number"
            domain={[-pad, pad]}
            tick={tickStyle}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: number) =>
              `${v > 0 ? "+" : v < 0 ? "−" : ""}${pkrShortBare(Math.abs(v))}`
            }
          />
          <YAxis
            type="category"
            dataKey="label"
            tick={tickStyle}
            tickLine={false}
            axisLine={false}
            width={84}
          />
          <Tooltip
            cursor={{ fill: "rgba(79,70,229,0.06)" }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const row = payload[0].payload as TornadoRow;
              return (
                <ChartTooltip title={`${row.label} ±15%`}>
                  <div className="space-y-0.5">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-subtle">−15%</span>
                      <span className="font-semibold">{formatPKR(row.low)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-subtle">+15%</span>
                      <span className="font-semibold">{formatPKR(row.high)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3 border-t border-border pt-0.5">
                      <span className="text-subtle">swing</span>
                      <span className="font-semibold">{formatPKR(row.swing)}</span>
                    </div>
                  </div>
                </ChartTooltip>
              );
            }}
          />
          <ReferenceLine x={0} stroke={CHART.axis} strokeWidth={1} />
          {/* Each offset bar is grounded at 0 (base bid) and extends to its side. */}
          <Bar dataKey="lowOffset" radius={2} maxBarSize={24}>
            {rows.map((r) => (
              <Cell key={`lo-${r.key}`} fill={CHART.muted} />
            ))}
          </Bar>
          <Bar dataKey="highOffset" radius={2} maxBarSize={24}>
            {rows.map((r) => (
              <Cell key={`hi-${r.key}`} fill={CHART.accent} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <p className="mt-1 text-center text-[11px] text-subtle tabular">
        Base bid {formatPKR(base)} · bars show ± swing in bid total
      </p>
    </div>
  );
}
