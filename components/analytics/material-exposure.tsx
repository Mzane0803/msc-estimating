"use client";

import { useMemo } from "react";
import {
  Bar,
  BarChart,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Project } from "@/lib/types";
import { keyMaterialTotals } from "@/lib/estimate";
import { formatPKR, formatPKRShort, formatQty, pkrShortBare } from "@/lib/format";
import { CHART, ChartTooltip, tickStyle } from "./chart-kit";

/** Reference unit prices (PKR) used to value procurement exposure. */
export const MATERIAL_PRICES = {
  cement: 1300, // Rs / 50kg bag
  steel: 280000, // Rs / ton
  bricks: 18, // Rs / brick
  sand: 50, // Rs / Cft
  aggregate: 110, // Rs / Cft
} as const;

interface ExposureRow {
  key: string;
  label: string;
  qty: number;
  unit: string;
  spend: number;
}

/**
 * Chart 3 — Material exposure. keyMaterialTotals × reference unit prices,
 * sorted descending. Shows where price risk concentrates.
 */
export function MaterialExposure({ project }: { project: Project }) {
  const rows = useMemo<ExposureRow[]>(() => {
    const t = keyMaterialTotals(project.lineItems);
    const all: ExposureRow[] = [
      {
        key: "cement",
        label: "Cement",
        qty: t.cementBags,
        unit: "bags",
        spend: t.cementBags * MATERIAL_PRICES.cement,
      },
      {
        key: "steel",
        label: "Steel",
        qty: t.steelTons,
        unit: "Ton",
        spend: t.steelTons * MATERIAL_PRICES.steel,
      },
      {
        key: "bricks",
        label: "Bricks",
        qty: t.bricks,
        unit: "Nos",
        spend: t.bricks * MATERIAL_PRICES.bricks,
      },
      {
        key: "sand",
        label: "Sand",
        qty: t.sandCft,
        unit: "Cft",
        spend: t.sandCft * MATERIAL_PRICES.sand,
      },
      {
        key: "aggregate",
        label: "Aggregate",
        qty: t.aggregateCft,
        unit: "Cft",
        spend: t.aggregateCft * MATERIAL_PRICES.aggregate,
      },
    ];
    return all.sort((a, b) => b.spend - a.spend);
  }, [project.lineItems]);

  const maxSpend = rows.reduce((m, r) => Math.max(m, r.spend), 0);

  return (
    <div className="h-[220px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          layout="vertical"
          data={rows}
          margin={{ top: 4, right: 64, bottom: 4, left: 4 }}
          barCategoryGap="28%"
        >
          <XAxis
            type="number"
            domain={[0, maxSpend * 1.18 || 1]}
            tick={tickStyle}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: number) => pkrShortBare(v)}
          />
          <YAxis
            type="category"
            dataKey="label"
            tick={tickStyle}
            tickLine={false}
            axisLine={false}
            width={70}
          />
          <Tooltip
            cursor={{ fill: "rgba(79,70,229,0.06)" }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const row = payload[0].payload as ExposureRow;
              return (
                <ChartTooltip title={row.label}>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{formatPKR(row.spend)}</span>
                    <span className="text-subtle">
                      {formatQty(row.qty, row.qty % 1 ? 1 : 0)} {row.unit}
                    </span>
                  </div>
                </ChartTooltip>
              );
            }}
          />
          <Bar dataKey="spend" radius={[0, 3, 3, 0]} maxBarSize={26}>
            {rows.map((_, i) => (
              <Cell key={i} fill={i === 0 ? CHART.accent : CHART.muted} />
            ))}
            <LabelList
              dataKey="spend"
              position="right"
              content={(props: unknown) => {
                const p = props as {
                  x?: number;
                  y?: number;
                  width?: number;
                  height?: number;
                  value?: number;
                };
                if (
                  p.x == null ||
                  p.y == null ||
                  p.height == null ||
                  p.value == null
                )
                  return null;
                return (
                  <text
                    x={p.x + (p.width ?? 0) + 8}
                    y={p.y + p.height / 2}
                    dominantBaseline="central"
                    fontSize={11}
                    className="tabular"
                    fill={CHART.axis}
                  >
                    {formatPKRShort(p.value)}
                  </text>
                );
              }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
