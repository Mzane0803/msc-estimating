"use client";

import { ChevronRight } from "lucide-react";
import type { TradeRollup } from "@/lib/estimate";
import { formatPKRShort, percent } from "@/lib/format";
import { tradeColor } from "./cost-donut";
import { cn } from "@/lib/utils";

export function TradeTree({
  trades,
  collapsed,
  onToggle,
  onSelect,
}: {
  trades: TradeRollup[];
  collapsed: Set<string>;
  onToggle: (id: string) => void;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="text-sm">
      <div className="px-2 pb-2 text-[11px] font-medium uppercase tracking-wide text-subtle">
        Trades
      </div>
      <ul className="space-y-0.5">
        {trades.map((t, i) => {
          const isCollapsed = collapsed.has(t.tradeId);
          return (
            <li key={t.tradeId}>
              <button
                onClick={() => onSelect(t.tradeId)}
                className="group flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-surface-muted"
              >
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggle(t.tradeId);
                  }}
                  className="flex size-4 shrink-0 items-center justify-center text-subtle"
                >
                  <ChevronRight
                    className={cn("size-3.5 transition-transform", !isCollapsed && "rotate-90")}
                  />
                </span>
                <span
                  className="size-2 shrink-0 rounded-[3px]"
                  style={{ backgroundColor: tradeColor(i) }}
                  aria-hidden
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-medium">{t.name}</span>
                  <span className="mt-1 flex h-1 overflow-hidden rounded-full bg-surface-muted">
                    <span
                      className="h-full rounded-full"
                      style={{ width: `${Math.max(t.share * 100, 1.5)}%`, backgroundColor: tradeColor(i) }}
                    />
                  </span>
                </span>
                <span className="shrink-0 text-right">
                  <span className="block text-[12px] font-medium tabular">
                    {formatPKRShort(t.amount)}
                  </span>
                  <span className="block text-[11px] tabular text-subtle">
                    {percent(t.share, 0)}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
