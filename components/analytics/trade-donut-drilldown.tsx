"use client";

import { useMemo, useState } from "react";
import { Layers } from "lucide-react";
import type { LineItem, Project } from "@/lib/types";
import {
  costByTrade,
  directCost,
  extendedCost,
  unitTotal,
  type TradeRollup,
} from "@/lib/estimate";
import { tradeName } from "@/lib/trades";
import { formatPKR, formatPKRShort, formatQty, percent } from "@/lib/format";
import { CostDonut, tradeColor } from "@/components/estimate/cost-donut";

interface DrillRow {
  id: string;
  itemCode: string;
  description: string;
  qty: number;
  unit: string;
  unitTotal: number;
  extended: number;
}

/**
 * Chart 1 — Cost-by-trade donut with click-to-drill. Reuses <CostDonut/>;
 * selecting a slice lists that trade's line items (code, qty×unit, extended
 * = quantity × unitTotal) in a panel beside the donut.
 */
export function TradeDonutDrilldown({ project }: { project: Project }) {
  const trades = useMemo<TradeRollup[]>(
    () => costByTrade(project.lineItems),
    [project.lineItems],
  );
  const total = useMemo(() => directCost(project.lineItems), [project.lineItems]);
  const [selected, setSelected] = useState<string | null>(null);

  // Keep a stable color per trade (donut colors follow rollup order).
  const colorByTrade = useMemo(() => {
    const map = new Map<string, string>();
    trades.forEach((t, i) => map.set(t.tradeId, tradeColor(i)));
    return map;
  }, [trades]);

  const activeTrade =
    selected ?? (trades.length > 0 ? trades[0].tradeId : null);

  const rows = useMemo<DrillRow[]>(() => {
    if (!activeTrade) return [];
    return project.lineItems
      .filter((li: LineItem) => li.tradeId === activeTrade)
      .map((li) => ({
        id: li.id,
        itemCode: li.itemCode,
        description: li.description,
        qty: li.quantity,
        unit: li.unit,
        unitTotal: unitTotal(li.cost),
        extended: extendedCost(li),
      }))
      .sort((a, b) => b.extended - a.extended);
  }, [project.lineItems, activeTrade]);

  const activeRollup = trades.find((t) => t.tradeId === activeTrade);
  const activeColor = activeTrade ? colorByTrade.get(activeTrade) : undefined;

  if (trades.length === 0) {
    return <EmptyHint label="No line items to break down yet." />;
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[260px_minmax(0,1fr)]">
      {/* Donut + legend */}
      <div>
        <CostDonut data={trades} total={total} onSlice={setSelected} />
        <ul className="mt-3 space-y-1">
          {trades.map((t) => {
            const active = t.tradeId === activeTrade;
            return (
              <li key={t.tradeId}>
                <button
                  type="button"
                  onClick={() => setSelected(t.tradeId)}
                  className={`flex w-full items-center gap-2 rounded-md px-2 py-1 text-left text-[12px] transition-colors hover:bg-surface-muted ${
                    active ? "bg-surface-muted" : ""
                  }`}
                >
                  <span
                    className="size-2.5 shrink-0 rounded-[3px]"
                    style={{ backgroundColor: colorByTrade.get(t.tradeId) }}
                  />
                  <span
                    className={`min-w-0 flex-1 truncate ${
                      active ? "font-medium text-foreground" : "text-muted"
                    }`}
                  >
                    {t.name}
                  </span>
                  <span className="shrink-0 tabular text-subtle">
                    {percent(t.share, 0)}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Drill-down panel */}
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span
            className="size-2.5 rounded-[3px]"
            style={{ backgroundColor: activeColor }}
          />
          <span className="text-[13px] font-semibold tracking-tight">
            {activeTrade ? tradeName(activeTrade as never) : "—"}
          </span>
          {activeRollup && (
            <span className="ml-auto text-[12px] text-muted tabular">
              {formatPKRShort(activeRollup.amount)}
              <span className="text-subtle"> · {activeRollup.itemCount} items</span>
            </span>
          )}
        </div>

        <div className="mt-2 overflow-hidden rounded-lg border border-border">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="border-b border-border text-left text-[10px] font-medium uppercase tracking-wide text-subtle">
                <th className="px-3 py-2 font-medium">Code</th>
                <th className="px-3 py-2 font-medium">Description</th>
                <th className="px-3 py-2 text-right font-medium tabular">Qty × Unit</th>
                <th className="px-3 py-2 text-right font-medium tabular">Extended</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-border last:border-0">
                  <td className="px-3 py-1.5 font-mono text-[11px] text-subtle">
                    {r.itemCode}
                  </td>
                  <td className="px-3 py-1.5 text-muted">
                    <span className="line-clamp-1">{r.description}</span>
                  </td>
                  <td className="whitespace-nowrap px-3 py-1.5 text-right tabular text-muted">
                    {formatQty(r.qty, r.qty % 1 ? 2 : 0)}{" "}
                    <span className="text-subtle">{r.unit}</span>
                  </td>
                  <td className="whitespace-nowrap px-3 py-1.5 text-right font-medium tabular">
                    {formatPKR(r.extended)}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-3 py-4 text-center text-subtle">
                    No line items in this trade.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-[11px] text-subtle">
          <Layers className="-mt-0.5 mr-1 inline size-3" />
          Click a slice or legend row to break a trade down to its BOQ lines.
        </p>
      </div>
    </div>
  );
}

function EmptyHint({ label }: { label: string }) {
  return (
    <div className="flex h-[180px] items-center justify-center text-[13px] text-subtle">
      {label}
    </div>
  );
}
