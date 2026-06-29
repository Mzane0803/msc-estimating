"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { TradeRollup } from "@/lib/estimate";
import { formatPKR, formatPKRShort, percent } from "@/lib/format";

// Monochrome indigo ramp — keeps the chart on-brand (one accent, many shades).
export const TRADE_RAMP = [
  "#312e81", "#3730a3", "#4338ca", "#4f46e5", "#5b56ea", "#6366f1",
  "#7376f3", "#818cf8", "#93a0fa", "#a5b4fc", "#b9c4fd", "#c7d2fe",
];

export function tradeColor(index: number): string {
  return TRADE_RAMP[index % TRADE_RAMP.length];
}

export function CostDonut({
  data,
  total,
  onSlice,
}: {
  data: TradeRollup[];
  total: number;
  onSlice?: (tradeId: string) => void;
}) {
  return (
    <div className="relative h-[180px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="amount"
            nameKey="name"
            innerRadius={58}
            outerRadius={84}
            paddingAngle={1.5}
            stroke="var(--surface)"
            strokeWidth={2}
            isAnimationActive
            animationDuration={450}
            onClick={(d: { payload?: TradeRollup }) =>
              d?.payload && onSlice?.(d.payload.tradeId)
            }
            className={onSlice ? "cursor-pointer" : undefined}
          >
            {data.map((d, i) => (
              <Cell key={d.tradeId} fill={tradeColor(i)} />
            ))}
          </Pie>
          <Tooltip
            cursor={false}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const d = payload[0].payload as TradeRollup;
              return (
                <div className="rounded-lg border border-border bg-surface px-3 py-2 text-xs shadow-sm">
                  <div className="font-medium">{d.name}</div>
                  <div className="mt-0.5 flex items-center gap-2 tabular">
                    <span className="font-semibold">{formatPKR(d.amount)}</span>
                    <span className="text-subtle">{percent(d.share, 1)}</span>
                  </div>
                </div>
              );
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[10px] font-medium uppercase tracking-wide text-subtle">
          Direct cost
        </span>
        <span className="text-[15px] font-semibold tabular">{formatPKRShort(total)}</span>
      </div>
    </div>
  );
}
