"use client";

import { ChevronRight, ChevronUp, ChevronDown, Copy, Plus, Trash2 } from "lucide-react";
import type { LineItem, CostCategory, Unit } from "@/lib/types";
import { UNITS } from "@/lib/trades";
import { extendedCost } from "@/lib/estimate";
import { formatPKR, formatQty } from "@/lib/format";
import { tradeColor } from "./cost-donut";
import { NumericCell, TextCell } from "./editable-cell";
import { cn } from "@/lib/utils";

export interface TradeGroup {
  tradeId: string;
  name: string;
  items: LineItem[];
  subtotal: number;
  colorIndex: number;
}

const GRID =
  "grid grid-cols-[64px_minmax(150px,1fr)_60px_56px_96px_88px_84px_104px_64px] items-center gap-x-2";

const rate = (v: number) => (v === 0 ? "—" : formatPKR(v));

export function EstimateTable({
  groups,
  collapsed,
  onToggle,
  onUpdate,
  onDuplicate,
  onDelete,
  onMove,
  onAddItem,
}: {
  groups: TradeGroup[];
  collapsed: Set<string>;
  onToggle: (id: string) => void;
  onUpdate: (id: string, patch: Partial<LineItem>) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onMove: (id: string, dir: -1 | 1) => void;
  onAddItem: (tradeId: string) => void;
}) {
  return (
    <div className="w-full overflow-x-auto rounded-xl border border-border bg-surface lg:h-full lg:overflow-auto">
      <div className="min-w-[820px]">
        <div
          className={cn(
            GRID,
            "z-20 h-9 border-b border-border bg-surface px-4 text-[10px] font-semibold uppercase tracking-wide text-subtle lg:sticky lg:top-0",
          )}
        >
          <span>Code</span>
          <span>Description</span>
          <span className="text-right">Qty</span>
          <span>Unit</span>
          <span className="text-right">Material</span>
          <span className="text-right">Labor</span>
          <span className="text-right">Equip.</span>
          <span className="text-right">Amount</span>
          <span />
        </div>

        {groups.map((group) => {
          const isCollapsed = collapsed.has(group.tradeId);
          return (
            <div key={group.tradeId} id={`trade-${group.tradeId}`} className="scroll-mt-20">
              <div
                className={cn(
                  GRID,
                  "z-10 border-b border-border bg-surface-muted/95 px-4 py-2 backdrop-blur lg:sticky lg:top-9",
                )}
              >
                <button
                  onClick={() => onToggle(group.tradeId)}
                  className="col-span-2 flex items-center gap-2 text-left"
                >
                  <ChevronRight
                    className={cn(
                      "size-3.5 text-subtle transition-transform",
                      !isCollapsed && "rotate-90",
                    )}
                  />
                  <span
                    className="size-2 rounded-[3px]"
                    style={{ backgroundColor: tradeColor(group.colorIndex) }}
                  />
                  <span className="text-[13px] font-semibold tracking-tight">{group.name}</span>
                  <span className="rounded-full bg-surface px-1.5 py-px text-[10px] font-medium tabular text-subtle">
                    {group.items.length}
                  </span>
                </button>
                <div className="col-span-5 flex items-center justify-end">
                  <button
                    onClick={() => onAddItem(group.tradeId)}
                    className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium text-muted transition-colors hover:bg-surface hover:text-accent"
                  >
                    <Plus className="size-3" />
                    Add line
                  </button>
                </div>
                <span className="text-right text-[13px] font-semibold tabular">
                  {formatPKR(group.subtotal)}
                </span>
                <span />
              </div>

              {!isCollapsed &&
                group.items.map((item) => (
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
                    <NumericCell
                      value={item.quantity}
                      col="qty"
                      format={(v) => formatQty(v, v % 1 === 0 ? 0 : 2)}
                      onCommit={(v) => onUpdate(item.id, { quantity: v })}
                    />
                    <UnitSelect value={item.unit} onChange={(u) => onUpdate(item.id, { unit: u })} />
                    <CostInput item={item} field="material" onUpdate={onUpdate} />
                    <CostInput item={item} field="labor" onUpdate={onUpdate} />
                    <CostInput item={item} field="equipment" onUpdate={onUpdate} />
                    <span className="text-right text-[13px] font-medium tabular">
                      {formatPKR(extendedCost(item))}
                    </span>
                    <RowActions
                      onUp={() => onMove(item.id, -1)}
                      onDown={() => onMove(item.id, 1)}
                      onDuplicate={() => onDuplicate(item.id)}
                      onDelete={() => onDelete(item.id)}
                    />
                  </div>
                ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CostInput({
  item,
  field,
  onUpdate,
}: {
  item: LineItem;
  field: CostCategory;
  onUpdate: (id: string, patch: Partial<LineItem>) => void;
}) {
  const value = item.cost[field];
  return (
    <NumericCell
      value={value}
      col={field}
      step={1}
      format={rate}
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

function RowActions({
  onUp,
  onDown,
  onDuplicate,
  onDelete,
}: {
  onUp: () => void;
  onDown: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-center justify-end gap-0.5 opacity-0 transition-opacity group-hover/row:opacity-100">
      <div className="flex flex-col">
        <button onClick={onUp} title="Move up" className="flex h-3 items-center text-subtle hover:text-foreground">
          <ChevronUp className="size-3" />
        </button>
        <button onClick={onDown} title="Move down" className="flex h-3 items-center text-subtle hover:text-foreground">
          <ChevronDown className="size-3" />
        </button>
      </div>
      <button
        onClick={onDuplicate}
        title="Duplicate"
        className="flex size-6 items-center justify-center rounded text-subtle hover:bg-surface-muted hover:text-foreground"
      >
        <Copy className="size-3.5" />
      </button>
      <button
        onClick={onDelete}
        title="Delete"
        className="flex size-6 items-center justify-center rounded text-subtle hover:bg-neg-bg hover:text-neg"
      >
        <Trash2 className="size-3.5" />
      </button>
    </div>
  );
}
