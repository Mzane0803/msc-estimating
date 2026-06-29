"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  TrendingUp,
  Trophy,
  Layers3,
  Ruler,
  ArrowUpRight,
  Plus,
  BookOpen,
  BarChart3,
  CalendarRange,
  ShieldAlert,
} from "lucide-react";
import { computeBid } from "@/lib/estimate";
import { portfolioMarginAtRisk } from "@/lib/escalation";
import { formatPKR, formatPKRShort, percent } from "@/lib/format";
import { useStore } from "@/components/store/store-provider";
import { StatusPill } from "@/components/status-pill";
import { tradeColor } from "@/components/estimate/cost-donut";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const store = useStore();
  const active = store.projects.filter((p) => p.status !== "archived");

  const stats = useMemo(() => {
    const rows = active.map((p) => ({ p, bid: computeBid(p) }));
    const pipeline = rows
      .filter((r) => r.p.status === "submitted" || r.p.status === "draft")
      .reduce((s, r) => s + r.bid.bidTotal, 0);
    const wonValue = rows.filter((r) => r.p.status === "won").reduce((s, r) => s + r.bid.bidTotal, 0);
    const won = rows.filter((r) => r.p.status === "won").length;
    const lost = rows.filter((r) => r.p.status === "lost").length;
    const winRate = won + lost > 0 ? won / (won + lost) : 0;
    const activeBids = rows.filter((r) => r.p.status === "submitted").length;
    const avgPSft = rows.reduce((s, r) => s + r.bid.costPerSft, 0) / (rows.length || 1);
    const maxBid = Math.max(...rows.map((r) => r.bid.bidTotal), 1);
    return { rows, pipeline, wonValue, winRate, activeBids, avgPSft, maxBid };
  }, [active]);

  const risk = useMemo(
    () => portfolioMarginAtRisk(active, store.escalation),
    [active, store.escalation],
  );
  const erosion = risk.escalatedMargin - risk.baseMargin;

  const recent = [...active]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 5);

  const ranked = [...stats.rows].sort((a, b) => b.bid.bidTotal - a.bid.bidTotal).slice(0, 6);

  return (
    <>
      <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-border bg-background/85 px-6 backdrop-blur">
        <h1 className="text-[15px] font-semibold tracking-tight">Dashboard</h1>
        <div className="ml-auto">
          <Link href="/projects/new">
            <Button size="sm"><Plus />New estimate</Button>
          </Link>
        </div>
      </header>

      <div className="mx-auto w-full max-w-[1180px] px-6 py-7">
        {/* KPI row */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          <Kpi icon={<TrendingUp className="size-4" />} label="Pipeline value" value={formatPKRShort(stats.pipeline)} sub="Open bids & drafts" />
          <Kpi icon={<Trophy className="size-4" />} label="Win rate" value={percent(stats.winRate, 0)} sub={formatPKRShort(stats.wonValue) + " won"} />
          <Kpi icon={<Layers3 className="size-4" />} label="Active bids" value={String(stats.activeBids)} sub="Awaiting award" />
          <Kpi icon={<Ruler className="size-4" />} label="Avg Rs / Sft" value={formatPKR(stats.avgPSft)} sub="Across portfolio" />
          <Kpi
            icon={<ShieldAlert className="size-4" />}
            label="Margin at risk"
            value={formatPKRShort(Math.abs(erosion))}
            sub={`If escalation runs (${store.escalation.scenario})`}
            tone={erosion < 0 ? "neg" : "pos"}
          />
        </div>

        <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
          {/* Bid value by project */}
          <div className="rounded-xl border border-border bg-surface p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-[13px] font-semibold tracking-tight">Bid value by project</h2>
              <Link href="/analytics" className="flex items-center gap-1 text-[12px] text-accent hover:underline">
                Analytics <ArrowUpRight className="size-3.5" />
              </Link>
            </div>
            <div className="mt-4 space-y-3">
              {ranked.map(({ p, bid }, i) => (
                <Link key={p.id} href={`/project?p=${p.id}`} className="block">
                  <div className="flex items-center justify-between text-[13px]">
                    <span className="truncate font-medium">{p.name}</span>
                    <span className="tabular text-muted">{formatPKRShort(bid.bidTotal)}</span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-surface-muted">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${(bid.bidTotal / stats.maxBid) * 100}%`, backgroundColor: tradeColor(i) }}
                    />
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Recent + quick links */}
          <div className="space-y-5">
            <div className="rounded-xl border border-border bg-surface p-5">
              <h2 className="mb-3 text-[13px] font-semibold tracking-tight">Recently updated</h2>
              <div className="space-y-2.5">
                {recent.map((p) => (
                  <Link key={p.id} href={`/project?p=${p.id}`} className="flex items-center gap-2 text-[13px]">
                    <span className="min-w-0 flex-1 truncate">{p.name}</span>
                    <StatusPill status={p.status} />
                  </Link>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-border bg-surface p-5">
              <h2 className="mb-3 text-[13px] font-semibold tracking-tight">Jump to</h2>
              <div className="grid grid-cols-2 gap-2">
                <QuickLink href="/rates" icon={<BookOpen className="size-4" />} label="Rate Library" />
                <QuickLink href="/analytics" icon={<BarChart3 className="size-4" />} label="Analytics" />
                <QuickLink href="/portfolio" icon={<CalendarRange className="size-4" />} label="Escalation" />
                <QuickLink href="/projects" icon={<Layers3 className="size-4" />} label="All projects" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function Kpi({
  icon,
  label,
  value,
  sub,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  tone?: "neg" | "pos";
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="flex items-center gap-2 text-subtle">
        <span className={tone === "neg" ? "text-neg" : "text-accent"}>{icon}</span>
        <span className="text-[12px] font-medium text-muted">{label}</span>
      </div>
      <div className={cnTone(tone)}>{value}</div>
      <div className="mt-0.5 text-[12px] text-subtle">{sub}</div>
    </div>
  );
}

function cnTone(tone?: "neg" | "pos") {
  return (
    "mt-2 text-2xl font-semibold tracking-tight tabular " +
    (tone === "neg" ? "text-neg" : tone === "pos" ? "text-pos" : "")
  );
}

function QuickLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 rounded-lg border border-border bg-surface-muted px-3 py-2 text-[12px] font-medium text-muted transition-colors hover:text-foreground"
    >
      <span className="text-accent">{icon}</span>
      {label}
    </Link>
  );
}
