"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ArrowRight } from "lucide-react";
import type { Project } from "@/lib/types";
import { computeBid, costByTrade } from "@/lib/estimate";
import { tradeName, tradeOrder } from "@/lib/trades";
import { formatPKR, formatPKRShort, percent } from "@/lib/format";
import { useStore } from "@/components/store/store-provider";
import { StatusPill } from "@/components/status-pill";
import { cn } from "@/lib/utils";

export default function ComparePage() {
  const { projects } = useStore();
  const [aId, setAId] = useState(projects[0]?.id ?? "");
  const [bId, setBId] = useState(projects[1]?.id ?? projects[0]?.id ?? "");

  const a = projects.find((p) => p.id === aId);
  const b = projects.find((p) => p.id === bId);

  return (
    <>
      <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-border bg-background/85 px-6 backdrop-blur">
        <Link href="/projects" className="flex items-center gap-1 text-[13px] text-muted hover:text-foreground">
          <ChevronLeft className="size-4" /> Projects
        </Link>
        <span className="text-border-strong">/</span>
        <h1 className="text-[15px] font-semibold tracking-tight">Compare bids</h1>
      </header>

      <div className="mx-auto w-full max-w-[1080px] px-6 py-7">
        <div className="grid grid-cols-1 items-center gap-3 sm:grid-cols-[1fr_auto_1fr]">
          <Selector label="Version A" value={aId} onChange={setAId} projects={projects} />
          <ArrowRight className="mx-auto hidden size-4 text-subtle sm:block" />
          <Selector label="Version B" value={bId} onChange={setBId} projects={projects} />
        </div>

        {a && b ? <Comparison a={a} b={b} /> : (
          <p className="mt-10 text-center text-sm text-subtle">Select two projects to compare.</p>
        )}
      </div>
    </>
  );
}

function Selector({
  label,
  value,
  onChange,
  projects,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  projects: Project[];
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[12px] font-medium text-muted">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 w-full rounded-md border border-border-strong bg-surface px-3 text-[13px] outline-none focus:ring-2 focus:ring-[var(--accent-ring)]"
      >
        {projects.map((p) => (
          <option key={p.id} value={p.id}>{p.name}</option>
        ))}
      </select>
    </label>
  );
}

function Comparison({ a, b }: { a: Project; b: Project }) {
  const bidA = useMemo(() => computeBid(a), [a]);
  const bidB = useMemo(() => computeBid(b), [b]);

  const tradeRows = useMemo(() => {
    const ma = new Map(costByTrade(a.lineItems).map((t) => [t.tradeId, t.amount]));
    const mb = new Map(costByTrade(b.lineItems).map((t) => [t.tradeId, t.amount]));
    const ids = [...new Set([...ma.keys(), ...mb.keys()])].sort(
      (x, y) => tradeOrder(x) - tradeOrder(y),
    );
    return ids.map((id) => ({
      id,
      name: tradeName(id as never),
      a: ma.get(id) ?? 0,
      b: mb.get(id) ?? 0,
    }));
  }, [a, b]);

  return (
    <div className="mt-6 space-y-5">
      {/* Headline cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <HeadCard project={a} total={bidA.bidTotal} psft={bidA.costPerSft} margin={bidA.netMargin} />
        <HeadCard project={b} total={bidB.bidTotal} psft={bidB.costPerSft} margin={bidB.netMargin} accent />
      </div>

      {/* Line-by-line build-up */}
      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-[11px] font-medium uppercase tracking-wide text-subtle">
              <th className="px-5 py-2.5 text-left font-medium">Build-up</th>
              <th className="px-3 py-2.5 text-right font-medium">Version A</th>
              <th className="px-3 py-2.5 text-right font-medium">Version B</th>
              <th className="px-5 py-2.5 text-right font-medium">Δ Change</th>
            </tr>
          </thead>
          <tbody>
            <CmpRow label="Direct cost" a={bidA.directCost} b={bidB.directCost} />
            {bidA.markupLines.map((la, i) => (
              <CmpRow
                key={la.key}
                label={`${la.label} (${percent(la.rate, 1)} → ${percent(bidB.markupLines[i].rate, 1)})`}
                a={la.amount}
                b={bidB.markupLines[i].amount}
              />
            ))}
            <CmpRow label="Total bid" a={bidA.bidTotal} b={bidB.bidTotal} strong />
            <CmpRow label="Rate per Sft" a={bidA.costPerSft} b={bidB.costPerSft} />
          </tbody>
        </table>
      </div>

      {/* Per-trade */}
      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-[11px] font-medium uppercase tracking-wide text-subtle">
              <th className="px-5 py-2.5 text-left font-medium">Trade</th>
              <th className="px-3 py-2.5 text-right font-medium">Version A</th>
              <th className="px-3 py-2.5 text-right font-medium">Version B</th>
              <th className="px-5 py-2.5 text-right font-medium">Δ Change</th>
            </tr>
          </thead>
          <tbody>
            {tradeRows.map((t) => (
              <CmpRow key={t.id} label={t.name} a={t.a} b={t.b} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function HeadCard({
  project,
  total,
  psft,
  margin,
  accent,
}: {
  project: Project;
  total: number;
  psft: number;
  margin: number;
  accent?: boolean;
}) {
  return (
    <div className={cn("rounded-xl border bg-surface p-5", accent ? "border-accent" : "border-border")}>
      <div className="flex items-center justify-between">
        <span className="truncate text-[13px] font-semibold tracking-tight">{project.name}</span>
        <StatusPill status={project.status} />
      </div>
      <div className="mt-2 text-2xl font-semibold tabular">{formatPKR(total)}</div>
      <div className="mt-1 flex gap-3 text-[12px] text-muted">
        <span className="tabular">{formatPKR(psft)} / Sft</span>
        <span className="tabular">margin {percent(margin, 1)}</span>
      </div>
    </div>
  );
}

function CmpRow({
  label,
  a,
  b,
  strong,
}: {
  label: string;
  a: number;
  b: number;
  strong?: boolean;
}) {
  const delta = b - a;
  const pct = a !== 0 ? delta / a : 0;
  const tone = delta > 0 ? "text-neg" : delta < 0 ? "text-pos" : "text-subtle";
  return (
    <tr className="border-b border-border last:border-0">
      <td className={cn("px-5 py-2.5", strong && "font-semibold")}>{label}</td>
      <td className="px-3 py-2.5 text-right tabular text-muted">{formatPKR(a)}</td>
      <td className={cn("px-3 py-2.5 text-right tabular", strong && "font-semibold")}>{formatPKR(b)}</td>
      <td className="px-5 py-2.5 text-right tabular">
        <span className={tone}>
          {delta === 0 ? "—" : `${delta > 0 ? "+" : "−"}${formatPKRShort(Math.abs(delta))}`}
        </span>
        {delta !== 0 && a !== 0 && (
          <span className={cn("ml-1.5 text-[11px]", tone)}>({delta > 0 ? "+" : ""}{percent(pct, 1)})</span>
        )}
      </td>
    </tr>
  );
}
