"use client";

import * as React from "react";
import { Copy, Plus, Trash2 } from "lucide-react";
import type { RateItem, Unit, CostCategory } from "@/lib/types";
import { UNITS, CSR_SCHEDULES } from "@/lib/trades";
import type { CSRSchedule } from "@/lib/trades";
import { unitTotal } from "@/lib/estimate";
import { formatPKR } from "@/lib/format";
import { NumericCell, TextCell } from "@/components/estimate/editable-cell";
import { cn } from "@/lib/utils";

export interface RateGroup {
  tradeId: string;
  name: string;
  rates: RateItem[];
}

// Code · Description · Unit · Material · Labor · Equipment · Rate · Schedule · actions
const GRID =
  "grid grid-cols-[88px_minmax(180px,1fr)_64px_104px_96px_96px_112px_148px_56px] items-center gap-x-2";

const cost = (v: number) => (v === 0 ? "—" : formatPKR(v));

export function RateTable({
  groups,
  onUpdate,
  onDuplicate,
  onDelete,
  onAddRate,
}: {
  groups: RateGroup[];
  onUpdate: (id: string, patch: Partial<RateItem>) => void;
  onDuplicate: (rate: RateItem) => void;
  onDelete: (id: string) => void;
  onAddRate: (tradeId: string) => void;
}) {
  return (
    <div className="w-full overflow-x-auto rounded-xl border border-border bg-surface">
      <div className="min-w-[940px]">
        <div
          className={cn(
            GRID,
            "sticky top-0 z-20 h-9 border-b border-border bg-surface px-4 text-[10px] font-semibold uppercase tracking-wide text-subtle",
          )}
        >
          <span>Code</span>
          <span>Description</span>
          <span>Unit</span>
          <span className="text-right">Material</span>
          <span className="text-right">Labor</span>
          <span className="text-right">Equip.</span>
          <span className="text-right">Rate</span>
          <span>Schedule</span>
          <span />
        </div>

        {groups.map((group) => (
          <div key={group.tradeId} id={`rate-trade-${group.tradeId}`} className="scroll-mt-20">
            <div
              className={cn(
                GRID,
                "sticky top-9 z-10 border-b border-border bg-surface-muted/95 px-4 py-2 backdrop-blur",
              )}
            >
              <div className="col-span-7 flex items-center gap-2">
                <span className="text-[13px] font-semibold tracking-tight">{group.name}</span>
                <span className="rounded-full bg-surface px-1.5 py-px text-[10px] font-medium tabular text-subtle">
                  {group.rates.length}
                </span>
              </div>
              <div className="col-span-2 flex items-center justify-end">
                <button
                  onClick={() => onAddRate(group.tradeId)}
                  className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium text-muted transition-colors hover:bg-surface hover:text-accent"
                >
                  <Plus className="size-3" />
                  Add rate
                </button>
              </div>
            </div>

            {group.rates.map((item) => (
              <div
                key={item.id}
                className={cn(
                  GRID,
                  "group/row border-b border-border px-4 transition-colors last:border-0 hover:bg-[#fcfcfb]",
                )}
              >
                <TextCell
                  value={item.itemCode}
                  col="code"
                  className="tabular text-[11px] text-subtle"
                  onCommit={(v) => onUpdate(item.id, { itemCode: v })}
                />
                <TextCell
                  value={item.description}
                  col="desc"
                  onCommit={(v) => onUpdate(item.id, { description: v })}
                />
                <UnitSelect value={item.unit} onChange={(u) => onUpdate(item.id, { unit: u })} />
                <CostInput item={item} field="material" onUpdate={onUpdate} />
                <CostInput item={item} field="labor" onUpdate={onUpdate} />
                <CostInput item={item} field="equipment" onUpdate={onUpdate} />
                <span className="text-right text-[13px] font-semibold tabular">
                  {formatPKR(unitTotal(item.cost))}
                </span>
                <ScheduleSelect
                  value={item.schedule}
                  onChange={(s) => onUpdate(item.id, { schedule: s })}
                />
                <RowActions
                  onDuplicate={() => onDuplicate(item)}
                  onDelete={() => onDelete(item.id)}
                />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function CostInput({
  item,
  field,
  onUpdate,
}: {
  item: RateItem;
  field: CostCategory;
  onUpdate: (id: string, patch: Partial<RateItem>) => void;
}) {
  const value = item.cost[field];
  return (
    <NumericCell
      value={value}
      col={field}
      step={1}
      format={cost}
      className={value === 0 ? "text-subtle" : undefined}
      onCommit={(v) => onUpdate(item.id, { cost: { ...item.cost, [field]: v } })}
    />
  );
}

function UnitSelect({ value, onChange }: { value: Unit; onChange: (u: Unit) => void }) {
  return (
    <select
      data-col="unit"
      value={value}
      onChange={(e) => onChange(e.target.value as Unit)}
      className="-mx-1 cursor-pointer rounded-sm bg-transparent px-1 py-1.5 text-[12px] text-muted outline-none transition-colors hover:bg-surface-muted focus:bg-surface focus:ring-2 focus:ring-[var(--accent-ring)]"
    >
      {UNITS.map((u) => (
        <option key={u} value={u}>
          {u}
        </option>
      ))}
    </select>
  );
}

function ScheduleSelect({
  value,
  onChange,
}: {
  value: CSRSchedule;
  onChange: (s: CSRSchedule) => void;
}) {
  return (
    <select
      data-col="schedule"
      value={value}
      onChange={(e) => onChange(e.target.value as CSRSchedule)}
      className="-mx-1 w-full cursor-pointer truncate rounded-sm bg-transparent px-1 py-1.5 text-[12px] text-muted outline-none transition-colors hover:bg-surface-muted focus:bg-surface focus:ring-2 focus:ring-[var(--accent-ring)]"
    >
      {CSR_SCHEDULES.map((s) => (
        <option key={s} value={s}>
          {s}
        </option>
      ))}
    </select>
  );
}

function RowActions({
  onDuplicate,
  onDelete,
}: {
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const [confirming, setConfirming] = React.useState(false);

  // Reset the confirm prompt if the user moves on without acting.
  React.useEffect(() => {
    if (!confirming) return;
    const t = setTimeout(() => setConfirming(false), 4000);
    return () => clearTimeout(t);
  }, [confirming]);

  if (confirming) {
    return (
      <div className="flex items-center justify-end gap-1">
        <button
          onClick={onDelete}
          title="Confirm delete"
          className="rounded px-1.5 py-0.5 text-[11px] font-semibold text-neg transition-colors hover:bg-neg-bg"
        >
          Delete
        </button>
        <button
          onClick={() => setConfirming(false)}
          title="Cancel"
          className="rounded px-1.5 py-0.5 text-[11px] font-medium text-subtle transition-colors hover:bg-surface-muted hover:text-foreground"
        >
          Keep
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-end gap-0.5 opacity-0 transition-opacity group-hover/row:opacity-100 focus-within:opacity-100">
      <button
        onClick={onDuplicate}
        title="Duplicate"
        className="flex size-6 items-center justify-center rounded text-subtle hover:bg-surface-muted hover:text-foreground"
      >
        <Copy className="size-3.5" />
      </button>
      <button
        onClick={() => setConfirming(true)}
        title="Delete"
        className="flex size-6 items-center justify-center rounded text-subtle hover:bg-neg-bg hover:text-neg"
      >
        <Trash2 className="size-3.5" />
      </button>
    </div>
  );
}
