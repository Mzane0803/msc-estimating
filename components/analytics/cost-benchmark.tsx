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
import type { Project } from "@/lib/types";
import { computeBid } from "@/lib/estimate";
import { formatPKR, pkrShortBare } from "@/lib/format";
import { CHART, ChartTooltip, tickStyle } from "./chart-kit";

interface BenchRow {
  id: string;
  name: string;
  costPerSft: number;
  selected: boolean;
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * Chart 4 — Cost-per-Sft benchmark across all (non-archived) portfolio
 * projects. Selected project highlighted; median drawn as a ReferenceLine.
 */
export function CostBenchmark({
  projects,
  selectedId,
}: {
  projects: Project[];
  selectedId: string | null;
}) {
  const rows = useMemo<BenchRow[]>(() => {
    return projects
      .map((p) => ({
        id: p.id,
        name: p.name,
        costPerSft: computeBid(p).costPerSft,
        selected: p.id === selectedId,
      }))
      .sort((a, b) => b.costPerSft - a.costPerSft);
  }, [projects, selectedId]);

  const med = useMemo(
    () => median(rows.map((r) => r.costPerSft)),
    [rows],
  );

  if (rows.length === 0) {
    return (
      <div className="flex h-[260px] items-center justify-center text-[13px] text-subtle">
        No projects to benchmark.
      </div>
    );
  }

  // Grow height with project count so labels stay legible.
  const height = Math.max(220, rows.length * 34 + 40);

  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          layout="vertical"
          data={rows}
          margin={{ top: 4, right: 16, bottom: 4, left: 4 }}
          barCategoryGap="26%"
        >
          <XAxis
            type="number"
            tick={tickStyle}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: number) => pkrShortBare(v)}
          />
          <YAxis
            type="category"
            dataKey="name"
            tick={tickStyle}
            tickLine={false}
            axisLine={false}
            width={140}
            tickFormatter={(v: string) =>
              v.length > 20 ? `${v.slice(0, 19)}…` : v
            }
          />
          <Tooltip
            cursor={{ fill: "rgba(79,70,229,0.06)" }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const row = payload[0].payload as BenchRow;
              return (
                <ChartTooltip title={row.name}>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">
                      {formatPKR(row.costPerSft)}
                    </span>
                    <span className="text-subtle">/ Sft</span>
                  </div>
                </ChartTooltip>
              );
            }}
          />
          <ReferenceLine
            x={med}
            stroke={CHART.axis}
            strokeDasharray="4 4"
            label={{
              value: `Median ${pkrShortBare(med)}`,
              position: "top",
              fontSize: 10,
              fill: CHART.axis,
            }}
          />
          <Bar dataKey="costPerSft" radius={[0, 3, 3, 0]} maxBarSize={22}>
            {rows.map((r) => (
              <Cell
                key={r.id}
                fill={r.selected ? CHART.accent : CHART.muted}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
