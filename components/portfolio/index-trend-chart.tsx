"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { EscalationAssumptions, EscalationIndex } from "@/lib/types";
import { indexTrends } from "@/lib/escalation";
import { formatQty } from "@/lib/format";

// Distinct, on-brand shades (indigo ramp + two contrast hues for FX/labor so
// the six lines stay separable).
const SERIES: { key: EscalationIndex["key"]; label: string; color: string }[] = [
  { key: "steel", label: "Steel", color: "#312e81" },
  { key: "cement", label: "Cement", color: "#4338ca" },
  { key: "fuel", label: "Fuel", color: "#6366f1" },
  { key: "labor", label: "Labor", color: "#818cf8" },
  { key: "cpi", label: "CPI", color: "#a5b4fc" },
  { key: "fx", label: "FX", color: "#b45309" },
];

export function IndexTrendChart({ escalation }: { escalation: EscalationAssumptions }) {
  const data = indexTrends(escalation);
  const present = SERIES.filter((s) => escalation.indices.some((i) => i.key === s.key));

  return (
    <div>
      <div className="h-[260px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 4 }}>
            <CartesianGrid stroke="var(--border)" vertical={false} />
            <XAxis
              dataKey="year"
              tickLine={false}
              axisLine={{ stroke: "var(--border-strong)" }}
              tick={{ fontSize: 11, fill: "var(--subtle)" }}
            />
            <YAxis
              width={40}
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: "var(--subtle)" }}
              domain={[100, "auto"]}
            />
            <Tooltip
              cursor={{ stroke: "var(--border-strong)" }}
              content={<IndexTooltip series={present} />}
            />
            {present.map((s) => (
              <Line
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={s.label}
                stroke={s.color}
                strokeWidth={1.75}
                dot={false}
                isAnimationActive
                animationDuration={400}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 border-t border-border pt-3">
        {present.map((s) => (
          <span key={s.key} className="flex items-center gap-1.5 text-[11px] text-subtle">
            <span className="h-0.5 w-4 rounded-full" style={{ backgroundColor: s.color }} aria-hidden />
            {s.label}
          </span>
        ))}
        <span className="ml-auto text-[11px] text-subtle">base year = 100</span>
      </div>
    </div>
  );
}

interface TooltipPayloadItem {
  dataKey?: string | number;
  value?: number;
}

function IndexTooltip({
  active,
  payload,
  label,
  series,
}: {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string | number;
  series: { key: EscalationIndex["key"]; label: string; color: string }[];
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-surface px-3 py-2 text-xs shadow-sm">
      <div className="font-medium tabular">{label}</div>
      <dl className="mt-1 space-y-0.5 tabular">
        {series.map((s) => {
          const v = payload.find((p) => p.dataKey === s.key)?.value;
          if (v == null) return null;
          return (
            <div key={s.key} className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 text-subtle">
                <span className="size-2 rounded-full" style={{ backgroundColor: s.color }} aria-hidden />
                {s.label}
              </span>
              <span className="font-medium">{formatQty(v, v % 1 ? 1 : 0)}</span>
            </div>
          );
        })}
      </dl>
    </div>
  );
}
