"use client";

import { useMemo, useState } from "react";
import { CalendarRange } from "lucide-react";
import { useStore } from "@/components/store/store-provider";
import {
  portfolioByYear,
  portfolioMarginAtRisk,
} from "@/lib/escalation";
import { ScenarioToggle } from "@/components/portfolio/scenario-toggle";
import { AssumptionsEditor } from "@/components/portfolio/assumptions-editor";
import { MarginAtRisk } from "@/components/portfolio/margin-at-risk";
import { TimelineGantt } from "@/components/portfolio/timeline-gantt";
import { PortfolioAreaChart } from "@/components/portfolio/portfolio-area-chart";
import { ProjectEscalationChart } from "@/components/portfolio/project-escalation-chart";
import { IndexTrendChart } from "@/components/portfolio/index-trend-chart";

export default function PortfolioPage() {
  const { projects, escalation, updateEscalation, updateIndex } = useStore();

  // Projects that carry real cost into the escalation model.
  const modeled = useMemo(
    () => projects.filter((p) => p.status !== "archived" && p.lineItems.length > 0),
    [projects],
  );

  const [selectedProjectId, setSelectedProjectId] = useState<string>("");

  // Everything below re-derives whenever `projects` or `escalation`
  // (assumptions + scenario) changes — that's how flipping the scenario or
  // editing an index instantly re-runs the whole module.
  const marginAtRisk = useMemo(
    () => portfolioMarginAtRisk(modeled, escalation),
    [modeled, escalation],
  );

  const byYear = useMemo(
    () => portfolioByYear(modeled, escalation),
    [modeled, escalation],
  );

  return (
    <>
      <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-border bg-background/80 px-6 backdrop-blur">
        <CalendarRange className="size-4 text-accent" />
        <div className="min-w-0">
          <h1 className="text-[15px] font-semibold leading-tight tracking-tight">
            Portfolio &amp; Escalation
          </h1>
          <p className="text-[11px] leading-tight text-subtle">
            Multi-year program modeling — escalated cost &amp; margin at risk across the book
          </p>
        </div>
        <div className="ml-auto hidden sm:block">
          <ScenarioToggle
            scenario={escalation.scenario}
            onChange={(scenario) => updateEscalation({ scenario })}
          />
        </div>
      </header>

      <div className="mx-auto w-full max-w-[1180px] px-6 py-7">
        {/* Scenario toggle on mobile (header hides it) */}
        <div className="mb-5 sm:hidden">
          <ScenarioToggle
            scenario={escalation.scenario}
            onChange={(scenario) => updateEscalation({ scenario })}
          />
        </div>

        {/* Margin at risk KPIs */}
        <MarginAtRisk data={marginAtRisk} />

        {/* Assumptions + index trends */}
        <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
          <AssumptionsEditor
            escalation={escalation}
            onIndexChange={updateIndex}
            onImportedShareChange={(importedShare) => updateEscalation({ importedShare })}
          />
          <div className="rounded-xl border border-border bg-surface p-5">
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-semibold tracking-tight">Material index trend</span>
              <span className="text-[11px] text-subtle tabular">
                under {SCENARIO_LABEL[escalation.scenario]}
              </span>
            </div>
            <div className="mt-3">
              <IndexTrendChart escalation={escalation} />
            </div>
          </div>
        </div>

        {/* Timeline gantt */}
        <div className="mt-5">
          <TimelineGantt projects={projects} escalation={escalation} />
        </div>

        {/* Cost charts */}
        <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
          <div className="rounded-xl border border-border bg-surface p-5">
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-semibold tracking-tight">Backlog cost by year</span>
              <span className="text-[11px] text-subtle">nominal vs. base</span>
            </div>
            <p className="mt-0.5 text-[11px] text-subtle">
              Escalated (nominal) backlog across the portfolio; dashed line is the un-escalated base.
            </p>
            <div className="mt-3">
              <PortfolioAreaChart data={byYear} />
            </div>
          </div>

          <div className="rounded-xl border border-border bg-surface p-5">
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-semibold tracking-tight">Project cost path</span>
              <span className="text-[11px] text-subtle">base · nominal · real</span>
            </div>
            <p className="mt-0.5 text-[11px] text-subtle">
              How one project&apos;s yearly cost diverges as escalation compounds.
            </p>
            <div className="mt-3">
              <ProjectEscalationChart
                projects={modeled}
                escalation={escalation}
                selectedId={selectedProjectId}
                onSelect={setSelectedProjectId}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

const SCENARIO_LABEL: Record<string, string> = {
  base: "base case",
  high: "high inflation",
  shock: "devaluation shock",
};
