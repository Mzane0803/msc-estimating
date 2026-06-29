"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { PortfolioYear } from "@/lib/escalation";
import { formatPKR, pkrShortBare } from "@/lib/format";

export function PortfolioAreaChart({ data }: { data: PortfolioYear[] }) {
  if (!data.length) {
    return (
      <EmptyChart message="No scheduled cost across the horizon yet." />
    );
  }

  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 4 }}>
          <defs>
            <linearGradient id="nominalFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4f46e5" stopOpacity={0.22} />
              <stop offset="100%" stopColor="#4f46e5" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--border)" vertical={false} />
          <XAxis
            dataKey="year"
            tickLine={false}
            axisLine={{ stroke: "var(--border-strong)" }}
            tick={{ fontSize: 11, fill: "var(--subtle)" }}
          />
          <YAxis
            width={52}
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: "var(--subtle)" }}
            tickFormatter={(v: number) => pkrShortBare(v)}
          />
          <Tooltip cursor={{ stroke: "var(--border-strong)" }} content={<AreaTooltip />} />
          <Area
            type="monotone"
            dataKey="nominal"
            name="Nominal (escalated)"
            stroke="#4f46e5"
            strokeWidth={2}
            fill="url(#nominalFill)"
            isAnimationActive
            animationDuration={450}
          />
          <Line
            type="monotone"
            dataKey="base"
            name="Base (un-escalated)"
            stroke="#9a9aa0"
            strokeWidth={1.5}
            strokeDasharray="4 4"
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

interface TooltipPayloadItem {
  dataKey?: string | number;
  name?: string | number;
  value?: number;
  color?: string;
}

function AreaTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string | number;
}) {
  if (!active || !payload?.length) return null;
  const nominal = payload.find((p) => p.dataKey === "nominal")?.value ?? 0;
  const base = payload.find((p) => p.dataKey === "base")?.value ?? 0;
  const gap = nominal - base;
  return (
    <div className="rounded-lg border border-border bg-surface px-3 py-2 text-xs shadow-sm">
      <div className="font-medium tabular">{label}</div>
      <dl className="mt-1 space-y-0.5 tabular">
        <Line2 swatch="#4f46e5" label="Nominal" value={formatPKR(nominal)} />
        <Line2 swatch="#9a9aa0" label="Base" value={formatPKR(base)} />
        <div className="mt-1 border-t border-dashed border-border-strong pt-1 text-[11px]">
          <span className="text-subtle">Escalation gap </span>
          <span className="font-semibold text-warn">{formatPKR(gap)}</span>
        </div>
      </dl>
    </div>
  );
}

function Line2({ swatch, label, value }: { swatch: string; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="flex items-center gap-1.5 text-subtle">
        <span className="size-2 rounded-full" style={{ backgroundColor: swatch }} aria-hidden />
        {label}
      </span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

export function EmptyChart({ message }: { message: string }) {
  return (
    <div className="flex h-[280px] w-full items-center justify-center text-[13px] text-subtle">
      {message}
    </div>
  );
}
