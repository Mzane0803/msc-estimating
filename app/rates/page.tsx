"use client";

import * as React from "react";
import { BookOpen, Plus } from "lucide-react";
import { useStore } from "@/components/store/store-provider";
import { TRADES, tradeName, tradeOrder } from "@/lib/trades";
import type { RateItem } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  RateFilters,
  type ScheduleFilter,
  type TradeFilter,
} from "@/components/rates/rate-filters";
import { RateTable, type RateGroup } from "@/components/rates/rate-table";

export default function RatesPage() {
  const { rates, addRate, updateRate, deleteRate } = useStore();

  const [trade, setTrade] = React.useState<TradeFilter>("all");
  const [schedule, setSchedule] = React.useState<ScheduleFilter>("all");
  const [query, setQuery] = React.useState("");

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return rates.filter((r) => {
      if (trade !== "all" && r.tradeId !== trade) return false;
      if (schedule !== "all" && r.schedule !== schedule) return false;
      if (q) {
        const haystack = `${r.itemCode} ${r.description}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [rates, trade, schedule, query]);

  const groups = React.useMemo<RateGroup[]>(() => {
    const byTrade = new Map<string, RateItem[]>();
    for (const r of filtered) {
      const list = byTrade.get(r.tradeId) ?? [];
      list.push(r);
      byTrade.set(r.tradeId, list);
    }
    return [...byTrade.entries()]
      .map(([tradeId, list]) => ({
        tradeId,
        name: tradeName(tradeId as never),
        rates: list,
      }))
      .sort((a, b) => tradeOrder(a.tradeId) - tradeOrder(b.tradeId));
  }, [filtered]);

  const handleNewRate = () => {
    const tradeId = trade === "all" ? TRADES[0].id : trade;
    addRate({ tradeId });
  };

  const handleAddRate = (tradeId: string) => {
    addRate({ tradeId: tradeId as RateItem["tradeId"] });
  };

  const handleDuplicate = (rate: RateItem) => {
    addRate({
      tradeId: rate.tradeId,
      itemCode: rate.itemCode,
      description: `${rate.description} (copy)`,
      unit: rate.unit,
      cost: { ...rate.cost },
      keyMaterials: rate.keyMaterials ? { ...rate.keyMaterials } : undefined,
      schedule: rate.schedule,
    });
  };

  const hasFilters = trade !== "all" || schedule !== "all" || query.trim() !== "";

  return (
    <>
      <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/80 px-6 backdrop-blur">
        <h1 className="text-[15px] font-semibold tracking-tight">Rate Library</h1>
        <span className="rounded-full bg-surface-muted px-2 py-0.5 text-[11px] font-medium text-muted tabular">
          {rates.length}
        </span>
        <div className="ml-auto">
          <Button size="sm" onClick={handleNewRate}>
            <Plus />
            New rate
          </Button>
        </div>
      </header>

      <div className="mx-auto w-full max-w-[1180px] px-6 py-7">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <RateFilters
            trade={trade}
            schedule={schedule}
            query={query}
            onTradeChange={setTrade}
            onScheduleChange={setSchedule}
            onQueryChange={setQuery}
          />
          <p className="text-[12px] text-subtle tabular">
            {filtered.length} of {rates.length} rates
          </p>
        </div>

        {groups.length > 0 ? (
          <RateTable
            groups={groups}
            onUpdate={updateRate}
            onDuplicate={handleDuplicate}
            onDelete={deleteRate}
            onAddRate={handleAddRate}
          />
        ) : (
          <EmptyState hasFilters={hasFilters} onNewRate={handleNewRate} />
        )}
      </div>
    </>
  );
}

function EmptyState({
  hasFilters,
  onNewRate,
}: {
  hasFilters: boolean;
  onNewRate: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border-strong bg-surface px-6 py-20 text-center">
      <span className="flex size-10 items-center justify-center rounded-full bg-surface-muted text-subtle">
        <BookOpen className="size-5" />
      </span>
      <p className="mt-4 text-sm font-medium text-foreground">
        {hasFilters ? "No rates match these filters" : "No rates yet"}
      </p>
      <p className="mt-1 max-w-sm text-[13px] text-subtle">
        {hasFilters
          ? "Try a different trade, schedule, or search term."
          : "Build your master schedule of unit rates to price every bid."}
      </p>
      {!hasFilters && (
        <Button size="sm" className="mt-5" onClick={onNewRate}>
          <Plus />
          New rate
        </Button>
      )}
    </div>
  );
}
