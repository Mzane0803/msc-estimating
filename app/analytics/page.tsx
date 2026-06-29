"use client";

import { useMemo, useState } from "react";
import { BarChart3, ChevronDown } from "lucide-react";
import { useStore } from "@/components/store/store-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Project } from "@/lib/types";
import { TradeDonutDrilldown } from "@/components/analytics/trade-donut-drilldown";
import { MarkupWaterfall } from "@/components/analytics/markup-waterfall";
import { MaterialExposure } from "@/components/analytics/material-exposure";
import { CostBenchmark } from "@/components/analytics/cost-benchmark";
import { SensitivityTornado } from "@/components/analytics/sensitivity-tornado";
import { WinLossFunnel } from "@/components/analytics/win-loss-funnel";
import { CashflowSCurve } from "@/components/analytics/cashflow-scurve";

export default function AnalyticsPage() {
  const { projects } = useStore();

  // Portfolio-wide charts use all non-archived projects.
  const portfolio = useMemo<Project[]>(
    () => projects.filter((p) => p.status !== "archived"),
    [projects],
  );

  const [selectedId, setSelectedId] = useState<string>(
    () => portfolio[0]?.id ?? projects[0]?.id ?? "",
  );

  const selected = useMemo<Project | undefined>(
    () => projects.find((p) => p.id === selectedId) ?? portfolio[0],
    [projects, portfolio, selectedId],
  );

  return (
    <>
      <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-border bg-background/80 px-6 backdrop-blur">
        <BarChart3 className="size-4 text-accent" />
        <h1 className="text-[15px] font-semibold tracking-tight">Analytics</h1>
        <span className="rounded-full bg-surface-muted px-2 py-0.5 text-[11px] font-medium text-muted tabular">
          {portfolio.length}
        </span>

        <div className="ml-auto">
          <ProjectSelector
            projects={portfolio}
            value={selected?.id ?? ""}
            onChange={setSelectedId}
          />
        </div>
      </header>

      <div className="mx-auto w-full max-w-[1180px] px-6 py-7">
        {!selected ? (
          <Card>
            <CardContent className="flex h-40 items-center justify-center pt-5 text-sm text-subtle">
              No projects yet — create an estimate to see analytics.
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* 1 — Cost-by-trade donut + drill-down (full width) */}
            <Card className="lg:col-span-2">
              <CardHeader className="flex items-baseline justify-between">
                <CardTitle>Cost by trade · {selected.name}</CardTitle>
                <span className="text-[11px] text-subtle">Direct cost breakdown</span>
              </CardHeader>
              <CardContent>
                <TradeDonutDrilldown project={selected} />
              </CardContent>
            </Card>

            {/* 2 — Markup waterfall */}
            <Card>
              <CardHeader>
                <CardTitle>Markup waterfall</CardTitle>
              </CardHeader>
              <CardContent>
                <MarkupWaterfall project={selected} />
              </CardContent>
            </Card>

            {/* 3 — Material exposure */}
            <Card>
              <CardHeader className="flex items-baseline justify-between">
                <CardTitle>Material price exposure</CardTitle>
                <span className="text-[11px] text-subtle">at reference rates</span>
              </CardHeader>
              <CardContent>
                <MaterialExposure project={selected} />
              </CardContent>
            </Card>

            {/* 5 — Sensitivity tornado */}
            <Card>
              <CardHeader className="flex items-baseline justify-between">
                <CardTitle>Bid sensitivity</CardTitle>
                <span className="text-[11px] text-subtle">±15% drivers</span>
              </CardHeader>
              <CardContent>
                <SensitivityTornado project={selected} />
              </CardContent>
            </Card>

            {/* 7 — Cash-flow S-curve */}
            <Card>
              <CardHeader className="flex items-baseline justify-between">
                <CardTitle>Cash-flow S-curve</CardTitle>
                <span className="text-[11px] text-subtle">
                  {selected.durationMonths} months
                </span>
              </CardHeader>
              <CardContent>
                <CashflowSCurve project={selected} />
              </CardContent>
            </Card>

            {/* 4 — Cost-per-Sft benchmark (full width, portfolio) */}
            <Card className="lg:col-span-2">
              <CardHeader className="flex items-baseline justify-between">
                <CardTitle>Cost / Sft benchmark</CardTitle>
                <span className="text-[11px] text-subtle">
                  Selected vs portfolio · median marked
                </span>
              </CardHeader>
              <CardContent>
                <CostBenchmark projects={portfolio} selectedId={selected.id} />
              </CardContent>
            </Card>

            {/* 6 — Win/loss funnel + KPIs (full width, portfolio) */}
            <Card className="lg:col-span-2">
              <CardHeader className="flex items-baseline justify-between">
                <CardTitle>Win / loss & pipeline</CardTitle>
                <span className="text-[11px] text-subtle">Across portfolio</span>
              </CardHeader>
              <CardContent>
                <WinLossFunnel projects={portfolio} />
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </>
  );
}

function ProjectSelector({
  projects,
  value,
  onChange,
}: {
  projects: Project[];
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={projects.length === 0}
        className="h-9 appearance-none rounded-md border border-border-strong bg-surface pl-3 pr-8 text-[13px] font-medium text-foreground transition-colors hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-ring)] disabled:opacity-50"
        aria-label="Select project"
      >
        {projects.length === 0 && <option value="">No projects</option>}
        {projects.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-subtle" />
    </div>
  );
}
