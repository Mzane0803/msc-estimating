"use client";

import {
  SlidersHorizontal,
  ShieldCheck,
  AlertTriangle,
  Package,
  Receipt,
} from "lucide-react";
import type { BidResult, TradeRollup } from "@/lib/estimate";
import type { KeyMaterials, Levies, Markups } from "@/lib/types";
import { formatPKR, formatPKRShort, formatQty, percent } from "@/lib/format";
import { useCountUp } from "@/components/use-count-up";
import { CostDonut } from "./cost-donut";
import { cn } from "@/lib/utils";

const WHATIF: { key: keyof Markups; label: string; max: number }[] = [
  { key: "overhead", label: "Overhead", max: 0.2 },
  { key: "profit", label: "Profit", max: 0.25 },
  { key: "contingency", label: "Contingency", max: 0.15 },
];

export function BidSummary({
  bid,
  trades,
  markups,
  levies,
  keyMaterials,
  pec,
  salesTaxAuthority,
  onMarkupChange,
  onLevyChange,
  onSlice,
}: {
  bid: BidResult;
  trades: TradeRollup[];
  markups: Markups;
  levies: Levies;
  keyMaterials: Required<KeyMaterials>;
  pec: { category: string; ceiling: number; exceeds: boolean };
  salesTaxAuthority: string;
  onMarkupChange: (key: keyof Markups, value: number) => void;
  onLevyChange: (patch: Partial<Levies>) => void;
  onSlice?: (tradeId: string) => void;
}) {
  const animatedTotal = useCountUp(bid.bidTotal);
  const marginLow = bid.netMargin < 0.05;

  return (
    <div className="space-y-4 pb-1">
      {/* Headline + waterfall */}
      <div className="rounded-xl border border-border bg-surface p-5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium uppercase tracking-wide text-subtle">
            Total bid
          </span>
          {pec.exceeds && (
            <span className="flex items-center gap-1 rounded-full bg-warn-bg px-2 py-0.5 text-[10px] font-medium text-warn">
              <AlertTriangle className="size-3" />
              Over {pec.category} ceiling
            </span>
          )}
        </div>
        <div className="mt-1 text-[28px] font-semibold leading-none tracking-tight tabular">
          {formatPKR(animatedTotal)}
        </div>
        <div className="mt-2 flex items-center gap-3 text-[12px] text-muted">
          <span className="tabular">
            <span className="font-medium text-foreground">{formatPKR(bid.costPerSft)}</span> / Sft
          </span>
          <span className="text-border-strong">|</span>
          <span className="tabular">
            Net margin{" "}
            <span className={cn("font-medium", marginLow ? "text-warn" : "text-pos")}>
              {percent(bid.netMargin, 1)}
            </span>
          </span>
        </div>

        <CostDonut data={trades} total={bid.directCost} onSlice={onSlice} />

        <dl className="mt-2 space-y-1.5 text-[13px]">
          <Row label="Direct cost" value={formatPKR(bid.directCost)} strong />
          {bid.markupLines.map((line) => (
            <Row
              key={line.key}
              label={line.key === "salesTax" ? `Sales Tax (${salesTaxAuthority})` : line.label}
              chip={percent(line.rate, (line.rate * 100) % 1 === 0 ? 0 : 1)}
              value={formatPKR(line.amount)}
              muted
            />
          ))}
          <div className="my-2 border-t border-dashed border-border-strong" />
          <Row label="Total bid" value={formatPKR(bid.bidTotal)} big />
        </dl>
      </div>

      {/* Key material quantities — what the contractor procures against */}
      <div className="rounded-xl border border-border bg-surface p-5">
        <div className="flex items-center gap-2">
          <Package className="size-4 text-accent" />
          <span className="text-sm font-semibold tracking-tight">Key materials</span>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3">
          <Material label="Cement" value={formatQty(Math.round(keyMaterials.cementBags))} unit="bags" />
          <Material label="Steel / Rebar" value={formatQty(keyMaterials.steelTons, keyMaterials.steelTons % 1 ? 1 : 0)} unit="Ton" />
          <Material label="Bricks" value={formatQty(Math.round(keyMaterials.bricks))} unit="Nos" />
          <Material label="Sand" value={formatQty(Math.round(keyMaterials.sandCft))} unit="Cft" />
          <Material label="Crush / Aggregate" value={formatQty(Math.round(keyMaterials.aggregateCft))} unit="Cft" />
        </div>
      </div>

      {/* Levies, securities & net receipt */}
      <div className="rounded-xl border border-border bg-surface p-5">
        <div className="flex items-center gap-2">
          <Receipt className="size-4 text-accent" />
          <span className="text-sm font-semibold tracking-tight">Levies & securities</span>
          <label className="ml-auto flex cursor-pointer items-center gap-1.5 text-[11px] text-muted">
            <input
              type="checkbox"
              checked={levies.isFiler}
              onChange={(e) => onLevyChange({ isFiler: e.target.checked })}
              className="accent-[var(--accent)]"
            />
            Filer
          </label>
        </div>
        <dl className="mt-3 space-y-1.5 text-[13px]">
          <Row
            label="Income tax withheld"
            chip={percent(levies.isFiler ? levies.incomeTaxWithholding : levies.incomeTaxWithholding * 2, 1)}
            value={`− ${formatPKR(bid.incomeTaxAmount)}`}
            muted
          />
          <Row label="Net receipt" value={formatPKR(bid.netReceipt)} strong />
          <div className="my-2 border-t border-dashed border-border-strong" />
          <Row label="Bid security" chip={percent(levies.bidSecurity, 1)} value={formatPKR(bid.bidSecurityAmount)} muted />
          <Row label="Performance guarantee" chip={percent(levies.performanceGuarantee, 1)} value={formatPKR(bid.performanceGuaranteeAmount)} muted />
          <Row label="Mobilization advance" chip={percent(levies.mobilizationAdvance, 1)} value={`+ ${formatPKR(bid.mobilizationAmount)}`} muted />
        </dl>
        <p className="mt-2.5 text-[11px] leading-snug text-subtle">
          Securities are bank guarantees; mobilization advance is cash paid up-front by the client —
          neither is part of the works price.
        </p>
      </div>

      {/* What-if */}
      <div className="rounded-xl border border-border bg-surface p-5">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="size-4 text-accent" />
          <span className="text-sm font-semibold tracking-tight">What-if</span>
          <span className="ml-auto text-[11px] text-subtle">live</span>
        </div>
        <div className="mt-4 space-y-4">
          {WHATIF.map(({ key, label, max }) => (
            <div key={key}>
              <div className="flex items-baseline justify-between">
                <label className="text-[12px] font-medium text-muted">{label}</label>
                <span className="text-[13px] font-semibold tabular">{percent(markups[key], 1)}</span>
              </div>
              <input
                type="range"
                min={0}
                max={max}
                step={0.0025}
                value={markups[key]}
                onChange={(e) => onMarkupChange(key, parseFloat(e.target.value))}
                className="mt-1.5 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-surface-muted accent-[var(--accent)]"
              />
            </div>
          ))}
        </div>

        <div
          className={cn(
            "mt-4 flex items-start gap-2.5 rounded-lg border p-3",
            marginLow ? "border-warn-bg bg-warn-bg/60" : "border-border bg-surface-muted",
          )}
        >
          <span className={cn("mt-0.5", marginLow ? "text-warn" : "text-pos")}>
            {marginLow ? <AlertTriangle className="size-4" /> : <ShieldCheck className="size-4" />}
          </span>
          <div className="text-[12px] leading-snug">
            <div className="font-medium text-foreground">
              Margin at risk · {formatPKRShort(bid.profitAmount)}
            </div>
            <p className="mt-0.5 text-muted">
              Contingency + profit buffer absorbs a{" "}
              <span className="font-medium tabular text-foreground">{percent(bid.overrunBuffer, 1)}</span>{" "}
              cost overrun before profit is wiped out.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Material({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div>
      <div className="text-[11px] text-subtle">{label}</div>
      <div className="mt-0.5 flex items-baseline gap-1">
        <span className="text-[15px] font-semibold tabular">{value}</span>
        <span className="text-[11px] text-subtle">{unit}</span>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  chip,
  strong,
  muted,
  big,
}: {
  label: string;
  value: string;
  chip?: string;
  strong?: boolean;
  muted?: boolean;
  big?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <dt className="flex min-w-0 items-center gap-1.5">
        <span
          className={cn(
            "truncate",
            big ? "text-sm font-semibold" : "text-[13px]",
            strong && "font-medium",
            muted && "text-muted",
          )}
        >
          {label}
        </span>
        {chip && (
          <span className="shrink-0 rounded bg-surface-muted px-1 py-px text-[10px] font-medium tabular text-subtle">
            {chip}
          </span>
        )}
      </dt>
      <dd
        className={cn(
          "shrink-0 tabular",
          big ? "text-base font-semibold" : strong ? "font-medium" : "text-muted",
        )}
      >
        {value}
      </dd>
    </div>
  );
}
