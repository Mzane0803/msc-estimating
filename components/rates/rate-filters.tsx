"use client";

import { Search } from "lucide-react";
import { TRADES, CSR_SCHEDULES } from "@/lib/trades";
import type { TradeId, CSRSchedule } from "@/lib/trades";

export type TradeFilter = TradeId | "all";
export type ScheduleFilter = CSRSchedule | "all";

const SELECT_CLASS =
  "h-8 cursor-pointer rounded-md border border-border bg-surface px-2.5 text-[13px] text-foreground outline-none transition-colors hover:bg-surface-muted focus:ring-2 focus:ring-[var(--accent-ring)]";

export function RateFilters({
  trade,
  schedule,
  query,
  onTradeChange,
  onScheduleChange,
  onQueryChange,
}: {
  trade: TradeFilter;
  schedule: ScheduleFilter;
  query: string;
  onTradeChange: (value: TradeFilter) => void;
  onScheduleChange: (value: ScheduleFilter) => void;
  onQueryChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-subtle" />
        <input
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search code or description…"
          className="h-8 w-64 rounded-md border border-border bg-surface pl-8 pr-2.5 text-[13px] text-foreground outline-none transition-colors placeholder:text-subtle focus:ring-2 focus:ring-[var(--accent-ring)]"
        />
      </div>

      <select
        value={trade}
        onChange={(e) => onTradeChange(e.target.value as TradeFilter)}
        className={SELECT_CLASS}
        aria-label="Filter by trade"
      >
        <option value="all">All trades</option>
        {TRADES.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </select>

      <select
        value={schedule}
        onChange={(e) => onScheduleChange(e.target.value as ScheduleFilter)}
        className={SELECT_CLASS}
        aria-label="Filter by schedule"
      >
        <option value="all">All schedules</option>
        {CSR_SCHEDULES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
    </div>
  );
}
