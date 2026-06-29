"use client";

import { Lock, TrendingDown, ShieldCheck, AlertTriangle } from "lucide-react";
import { formatPKRShort, percent } from "@/lib/format";
import { cn } from "@/lib/utils";

interface MarginData {
  lockedBid: number;
  baseCost: number;
  escalatedCost: number;
  baseMargin: number;
  escalatedMargin: number;
}

export function MarginAtRisk({ data }: { data: MarginData }) {
  const erosion = data.escalatedMargin - data.baseMargin; // negative = bad
  const baseMarginPct = data.lockedBid > 0 ? data.baseMargin / data.lockedBid : 0;
  const escMarginPct = data.lockedBid > 0 ? data.escalatedMargin / data.lockedBid : 0;
  const escNegative = data.escalatedMargin < 0;

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <Kpi
        icon={<Lock className="size-4" />}
        label="Locked bid value"
        value={formatPKRShort(data.lockedBid)}
        sub="Σ fixed-price contracts"
      />
      <Kpi
        icon={<ShieldCheck className="size-4" />}
        label="Base margin"
        value={formatPKRShort(data.baseMargin)}
        sub={`${percent(baseMarginPct, 1)} of bid · un-escalated`}
      />
      <Kpi
        icon={<TrendingDown className="size-4" />}
        label="Escalated margin"
        value={formatPKRShort(data.escalatedMargin)}
        sub={`${percent(escMarginPct, 1)} of bid · at today's path`}
        valueTone={escNegative ? "neg" : data.escalatedMargin < data.baseMargin ? "warn" : "pos"}
      />
      <Kpi
        icon={<AlertTriangle className="size-4" />}
        label="Margin erosion"
        value={formatPKRShort(erosion)}
        sub="Escalation vs. base profit"
        valueTone={erosion < 0 ? "neg" : "pos"}
        accentEdge={erosion < 0}
      />
    </div>
  );
}

function Kpi({
  icon,
  label,
  value,
  sub,
  valueTone,
  accentEdge,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  valueTone?: "pos" | "neg" | "warn";
  accentEdge?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border bg-surface p-4",
        accentEdge ? "border-neg-bg" : "border-border",
      )}
    >
      <div className="flex items-center gap-2 text-subtle">
        {icon}
        <span className="text-[11px] font-medium uppercase tracking-wide">{label}</span>
      </div>
      <div
        className={cn(
          "mt-2 text-[22px] font-semibold leading-none tracking-tight tabular",
          valueTone === "neg" && "text-neg",
          valueTone === "warn" && "text-warn",
          valueTone === "pos" && "text-pos",
        )}
      >
        {value}
      </div>
      <div className="mt-1.5 text-[11px] text-subtle tabular">{sub}</div>
    </div>
  );
}
