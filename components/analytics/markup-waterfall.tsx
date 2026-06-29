"use client";

import { useMemo } from "react";
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Project } from "@/lib/types";
import { computeBid } from "@/lib/estimate";
import { formatPKR, pkrShortBare } from "@/lib/format";
import { CHART, ChartTooltip, tickStyle } from "./chart-kit";

interface WaterfallRow {
  label: string;
  /** Transparent floating base so the visible delta starts at `base`. */
  base: number;
  /** Visible bar height (the delta or total). */
  delta: number;
  /** Running cumulative value at the top of this bar. */
  cumulative: number;
  isTotal: boolean;
}

/**
 * Chart 2 — Markup waterfall. Direct cost → +Overhead → +Profit →
 * +Contingency → +Sales Tax → Total bid. Floating-bar style: a transparent
 * base bar plus a visible delta bar in a stacked BarChart. First and last
 * bars are grounded at 0; delta bars are accent, totals darker.
 */
export function MarkupWaterfall({ project }: { project: Project }) {
  const rows = useMemo<WaterfallRow[]>(() => {
    const bid = computeBid(project);
    const out: WaterfallRow[] = [];

    // First bar: Direct cost, grounded at 0.
    out.push({
      label: "Direct",
      base: 0,
      delta: bid.directCost,
      cumulative: bid.directCost,
      isTotal: true,
    });

    let running = bid.directCost;
    for (const line of bid.markupLines) {
      const label = line.key === "salesTax" ? "Sales Tax" : line.label;
      out.push({
        label,
        base: running,
        delta: line.amount,
        cumulative: running + line.amount,
        isTotal: false,
      });
      running += line.amount;
    }

    // Last bar: Total bid, grounded at 0.
    out.push({
      label: "Total bid",
      base: 0,
      delta: bid.bidTotal,
      cumulative: bid.bidTotal,
      isTotal: true,
    });

    return out;
  }, [project]);

  return (
    <div className="h-[260px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={rows}
          margin={{ top: 8, right: 8, bottom: 4, left: 4 }}
          barCategoryGap="22%"
        >
          <XAxis
            dataKey="label"
            tick={tickStyle}
            tickLine={false}
            axisLine={{ stroke: CHART.grid }}
            interval={0}
          />
          <YAxis
            tick={tickStyle}
            tickLine={false}
            axisLine={false}
            width={52}
            tickFormatter={(v: number) => pkrShortBare(v)}
          />
          <Tooltip
            cursor={{ fill: "rgba(79,70,229,0.06)" }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const row = payload[0].payload as WaterfallRow;
              return (
                <ChartTooltip title={row.label}>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{formatPKR(row.delta)}</span>
                    {!row.isTotal && (
                      <span className="text-subtle">
                        running {formatPKR(row.cumulative)}
                      </span>
                    )}
                  </div>
                </ChartTooltip>
              );
            }}
          />
          {/* Transparent floating base. */}
          <Bar dataKey="base" stackId="wf" fill="transparent" isAnimationActive={false} />
          {/* Visible delta. */}
          <Bar dataKey="delta" stackId="wf" radius={[3, 3, 0, 0]} maxBarSize={56}>
            {rows.map((r) => (
              <Cell
                key={r.label}
                fill={r.isTotal ? CHART.accentDeep : CHART.accent}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
