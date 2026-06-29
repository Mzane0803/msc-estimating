"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, Printer, MapPin, Ruler, Clock, FileText, Pencil } from "lucide-react";
import type { Markups, ProjectStatus } from "@/lib/types";
import {
  computeBid,
  costByTrade,
  keyMaterialTotals,
  tradeSubtotal,
} from "@/lib/estimate";
import { pecCeiling, province } from "@/lib/trades";
import { formatQty } from "@/lib/format";
import { useStore } from "@/components/store/store-provider";
import { StatusPill } from "@/components/status-pill";
import { Button } from "@/components/ui/button";
import { TradeTree } from "./trade-tree";
import { EstimateTable, type TradeGroup } from "./estimate-table";
import { BidSummary } from "./bid-summary";

const STATUSES: ProjectStatus[] = ["draft", "submitted", "won", "lost", "archived"];

export function EstimateWorkspace({ projectId }: { projectId: string }) {
  const store = useStore();
  const project = store.getProject(projectId);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const items = project?.lineItems ?? [];
  const bid = useMemo(() => (project ? computeBid(project) : null), [project]);
  const trades = useMemo(() => costByTrade(items), [items]);
  const keyMaterials = useMemo(() => keyMaterialTotals(items), [items]);
  const groups = useMemo<TradeGroup[]>(
    () =>
      trades.map((t, i) => ({
        tradeId: t.tradeId,
        name: t.name,
        items: items.filter((it) => it.tradeId === t.tradeId),
        subtotal: tradeSubtotal(items, t.tradeId),
        colorIndex: i,
      })),
    [trades, items],
  );

  const toggle = useCallback((id: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const selectTrade = useCallback((id: string) => {
    document.getElementById(`trade-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  if (!project || !bid) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-10 text-center">
        <FileText className="size-8 text-subtle" />
        <p className="text-sm text-muted">This project could not be found.</p>
        <Link href="/projects">
          <Button variant="outline" size="sm">Back to projects</Button>
        </Link>
      </div>
    );
  }

  const contractor = store.getContractor(project.contractorId);
  const ceiling = contractor ? pecCeiling(contractor.pecCategory) : Infinity;
  const prov = province(project.province);

  return (
    <div className="flex flex-col lg:h-screen lg:overflow-hidden">
      <header className="sticky top-0 z-30 shrink-0 border-b border-border bg-background/85 backdrop-blur lg:static">
        <div className="flex h-14 items-center gap-3 px-6">
          <Link
            href="/projects"
            className="flex items-center gap-1 text-[13px] text-muted transition-colors hover:text-foreground"
          >
            <ChevronLeft className="size-4" />
            Projects
          </Link>
          <span className="text-border-strong">/</span>
          <h1 className="truncate text-[15px] font-semibold tracking-tight">{project.name}</h1>
          <select
            value={project.status}
            onChange={(e) => store.setProjectStatus(project.id, e.target.value as ProjectStatus)}
            className="rounded-md border border-border bg-surface px-1.5 py-0.5 text-[11px] font-medium text-muted outline-none focus:ring-2 focus:ring-[var(--accent-ring)]"
            aria-label="Status"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s[0].toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>
          <div className="ml-auto flex items-center gap-2">
            <Link href={`/project/edit?p=${project.id}`}>
              <Button variant="ghost" size="sm">
                <Pencil />
                Edit
              </Button>
            </Link>
            <Link href={`/project/print?p=${project.id}`}>
              <Button variant="outline" size="sm">
                <Printer />
                Print / PDF
              </Button>
            </Link>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1 px-6 pb-3 text-[12px] text-muted">
          <span>{project.client}</span>
          <Meta icon={<MapPin className="size-3.5" />}>{project.location}</Meta>
          <Meta icon={<Ruler className="size-3.5" />}>
            <span className="tabular">{formatQty(project.area)}</span> Sft
          </Meta>
          <Meta icon={<Clock className="size-3.5" />}>
            <span className="tabular">{project.durationMonths}</span> mo
          </Meta>
          <span className="rounded bg-surface-muted px-1.5 py-0.5 text-[11px] text-subtle">
            {project.csrSchedule}
          </span>
          {contractor && (
            <span className="text-subtle">
              {contractor.name} · <span className="tabular">{contractor.pecCategory}</span>
            </span>
          )}
          <span className="tabular text-subtle">{items.length} items</span>
          <span className="md:hidden">
            <StatusPill status={project.status} />
          </span>
        </div>
      </header>

      <div className="flex flex-col gap-4 p-4 lg:grid lg:min-h-0 lg:flex-1 lg:grid-cols-[minmax(0,1fr)_350px] lg:gap-5 lg:overflow-hidden lg:p-5 xl:grid-cols-[222px_minmax(0,1fr)_350px]">
        <aside className="hidden xl:block xl:min-h-0 xl:overflow-y-auto">
          <TradeTree trades={trades} collapsed={collapsed} onToggle={toggle} onSelect={selectTrade} />
        </aside>

        <main className="flex min-w-0 lg:min-h-0 lg:overflow-hidden">
          <EstimateTable
            groups={groups}
            collapsed={collapsed}
            onToggle={toggle}
            onUpdate={(id, patch) => store.updateLineItem(project.id, id, patch)}
            onDuplicate={(id) => store.duplicateLineItem(project.id, id)}
            onDelete={(id) => store.deleteLineItem(project.id, id)}
            onMove={(id, dir) => store.moveLineItem(project.id, id, dir)}
            onAddItem={(tradeId) => store.addLineItem(project.id, tradeId as never)}
          />
        </main>

        <aside className="min-w-0 lg:min-h-0 lg:overflow-y-auto">
          <BidSummary
            bid={bid}
            trades={trades}
            markups={project.markups}
            levies={project.levies}
            keyMaterials={keyMaterials}
            pec={{
              category: contractor?.pecCategory ?? "—",
              ceiling,
              exceeds: bid.bidTotal > ceiling,
            }}
            salesTaxAuthority={prov.authority}
            onMarkupChange={(key: keyof Markups, value) =>
              store.updateMarkups(project.id, { [key]: value })
            }
            onLevyChange={(patch) => store.updateLevies(project.id, patch)}
            onSlice={selectTrade}
          />
        </aside>
      </div>
    </div>
  );
}

function Meta({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="text-subtle">{icon}</span>
      {children}
    </span>
  );
}
