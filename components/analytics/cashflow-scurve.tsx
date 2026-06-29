"use client";

import { useMemo } from "react";
import {
  Area,
  ComposedChart,
  Line,
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

interface CurveRow {
  month: number;
  cost: number; // cumulative direct/works cost
  billing: number; // cumulative progress billing (cost grossed up by markups)
}

/** Logistic S-curve fraction of work complete at month m (1..n). */
function logistic(m: number, n: number): number {
  // Steepness k and midpoint at n/2 give a smooth start-slow / finish-slow curve.
  const k = 8 / n;
  const mid = n / 2;
  const f = (x: number) => 1 / (1 + Math.exp(-k * (x - mid)));
  const f0 = f(0);
  const fn = f(n);
  // Normalize so month 0 → 0 and month n → 1.
  return (f(m) - f0) / (fn - f0);
}

/**
 * Chart 7 — Cash-flow S-curve. Cumulative cost distributed over the duration
 * with a logistic (NOT linear) S-curve; a cumulative progress-billing line
 * (cost grossed up by the project markups) overlaid; mobilization advance
 * marked as an upfront inflow at month 0.
 */
export function CashflowSCurve({ project }: { project: Project }) {
  const { rows, mobilization, bidTotal, cost } = useMemo(() => {
    const bid = computeBid(project);
    const n = Math.max(1, Math.round(project.durationMonths));
    const directTotal = bid.directCost;
    // Gross-up factor: bid total per rupee of direct cost.
    const grossUp = directTotal > 0 ? bid.bidTotal / directTotal : 1;
    const mob = bid.mobilizationAmount;

    const data: CurveRow[] = [];
    // Month 0 anchor: mobilization advance is cash already in, work = 0.
    data.push({ month: 0, cost: 0, billing: 0 });
    for (let m = 1; m <= n; m++) {
      const frac = logistic(m, n);
      const cumCost = directTotal * frac;
      data.push({
        month: m,
        cost: cumCost,
        billing: cumCost * grossUp,
      });
    }
    return { rows: data, mobilization: mob, bidTotal: bid.bidTotal, cost: directTotal };
  }, [project]);

  const yMax = Math.max(bidTotal, mobilization) * 1.05 || 1;

  return (
    <div className="h-[260px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={rows}
          margin={{ top: 8, right: 12, bottom: 4, left: 4 }}
        >
          <defs>
            <linearGradient id="scurveFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={CHART.accent} stopOpacity={0.18} />
              <stop offset="100%" stopColor={CHART.accent} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="month"
            type="number"
            domain={[0, "dataMax"]}
            tick={tickStyle}
            tickLine={false}
            axisLine={{ stroke: CHART.grid }}
            tickFormatter={(v: number) => (v === 0 ? "M0" : `M${v}`)}
            allowDecimals={false}
          />
          <YAxis
            tick={tickStyle}
            tickLine={false}
            axisLine={false}
            width={52}
            domain={[0, yMax]}
            tickFormatter={(v: number) => pkrShortBare(v)}
          />
          <Tooltip
            cursor={{ stroke: CHART.grid }}
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              const row = payload[0].payload as CurveRow;
              return (
                <ChartTooltip title={row.month === 0 ? "Month 0 · start" : `Month ${label}`}>
                  <div className="space-y-0.5">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-subtle">Cum. cost</span>
                      <span className="font-semibold">{formatPKR(row.cost)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-subtle">Cum. billing</span>
                      <span className="font-semibold">{formatPKR(row.billing)}</span>
                    </div>
                  </div>
                </ChartTooltip>
              );
            }}
          />
          {/* Mobilization advance — upfront cash inflow at month 0. */}
          {mobilization > 0 && (
            <ReferenceLine
              y={mobilization}
              stroke={CHART.pos}
              strokeDasharray="4 4"
              label={{
                value: `Mobilization ${pkrShortBare(mobilization)}`,
                position: "insideTopLeft",
                fontSize: 10,
                fill: CHART.pos,
              }}
            />
          )}
          <Area
            type="monotone"
            dataKey="cost"
            stroke={CHART.accent}
            strokeWidth={2}
            fill="url(#scurveFill)"
            dot={false}
            name="Cumulative cost"
          />
          <Line
            type="monotone"
            dataKey="billing"
            stroke={CHART.accentDeep}
            strokeWidth={1.75}
            strokeDasharray="5 3"
            dot={false}
            name="Cumulative billing"
          />
        </ComposedChart>
      </ResponsiveContainer>
      <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 px-1 text-[11px] text-subtle">
        <Legend color={CHART.accent} label="Cumulative cost (S-curve)" />
        <Legend color={CHART.accentDeep} label="Cumulative billing" dashed />
        <span className="tabular">
          Total cost {pkrShortBare(cost)} · bill {pkrShortBare(bidTotal)}
        </span>
      </div>
    </div>
  );
}

function Legend({
  color,
  label,
  dashed,
}: {
  color: string;
  label: string;
  dashed?: boolean;
}) {
  return (
    <span className="flex items-center gap-1.5">
      <span
        className="inline-block h-0.5 w-4"
        style={{
          backgroundColor: dashed ? "transparent" : color,
          backgroundImage: dashed
            ? `repeating-linear-gradient(90deg, ${color} 0 4px, transparent 4px 7px)`
            : undefined,
        }}
      />
      {label}
    </span>
  );
}
