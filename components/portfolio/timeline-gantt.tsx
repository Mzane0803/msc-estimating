"use client";

import { useMemo } from "react";
import type { EscalationAssumptions, Project, ProjectStatus } from "@/lib/types";
import { projectEscalation } from "@/lib/escalation";
import { formatPKRShort } from "@/lib/format";

// Status → bar color (matches status-pill dots).
const STATUS_COLOR: Record<ProjectStatus, string> = {
  draft: "#9a9aa0",
  submitted: "#4f46e5",
  won: "#15803d",
  lost: "#b42318",
  archived: "#c4c4c8",
};

interface GanttRow {
  id: string;
  name: string;
  status: ProjectStatus;
  startFrac: number; // fractional year of start
  endFrac: number; // fractional year of finish
  escalatedCost: number;
}

/** Fractional year, e.g. 2026-07-01 → 2026.5. */
function fracYear(iso: string): number {
  const d = new Date(iso);
  const y = d.getUTCFullYear();
  const startOfYear = Date.UTC(y, 0, 1);
  const startOfNext = Date.UTC(y + 1, 0, 1);
  return y + (d.getTime() - startOfYear) / (startOfNext - startOfYear);
}

export function TimelineGantt({
  projects,
  escalation,
}: {
  projects: Project[];
  escalation: EscalationAssumptions;
}) {
  const { rows, minYear, maxYear } = useMemo(() => {
    const rows: GanttRow[] = projects
      .filter((p) => p.status !== "archived")
      .map((p) => {
        const startFrac = fracYear(p.startDate);
        const endFrac = startFrac + Math.max(p.durationMonths, 1) / 12;
        return {
          id: p.id,
          name: p.name,
          status: p.status,
          startFrac,
          endFrac,
          escalatedCost: projectEscalation(p, escalation).nominalCost,
        };
      })
      .sort((a, b) => a.startFrac - b.startFrac);

    const minYear = rows.length ? Math.floor(Math.min(...rows.map((r) => r.startFrac))) : escalation.baseYear;
    const maxYear = rows.length ? Math.ceil(Math.max(...rows.map((r) => r.endFrac))) : escalation.baseYear + 1;
    return { rows, minYear, maxYear };
  }, [projects, escalation]);

  const span = Math.max(maxYear - minYear, 1);
  const years: number[] = [];
  for (let y = minYear; y <= maxYear; y++) years.push(y);

  const pct = (frac: number) => ((frac - minYear) / span) * 100;

  if (!rows.length) {
    return (
      <div className="rounded-xl border border-border bg-surface p-8 text-center text-[13px] text-subtle">
        No active projects to schedule. Add a project with a start date and duration.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-semibold tracking-tight">Program timeline</span>
        <span className="text-[11px] text-subtle tabular">
          {minYear}–{maxYear} · escalated cost
        </span>
      </div>

      <div className="mt-4">
        {/* Year axis header */}
        <div className="relative mb-2 h-5 select-none">
          {years.map((y) => (
            <div
              key={y}
              className="absolute top-0 -translate-x-1/2 text-[11px] font-medium text-subtle tabular"
              style={{ left: `${pct(y)}%` }}
            >
              {y}
            </div>
          ))}
        </div>

        <div className="relative">
          {/* Year gridlines spanning all rows */}
          <div className="pointer-events-none absolute inset-0">
            {years.map((y) => (
              <div
                key={y}
                className="absolute bottom-0 top-0 w-px bg-border"
                style={{ left: `${pct(y)}%` }}
              />
            ))}
          </div>

          {/* Rows */}
          <div className="relative space-y-2">
            {rows.map((r) => {
              const left = pct(r.startFrac);
              const width = Math.max(pct(r.endFrac) - left, 1.5);
              const labelInside = width > 34;
              return (
                <div key={r.id} className="relative h-9">
                  <div
                    className="group absolute top-0 flex h-9 items-center rounded-md px-2.5 text-[12px] font-medium text-white shadow-sm transition-[filter] hover:brightness-105"
                    style={{
                      left: `${left}%`,
                      width: `${width}%`,
                      backgroundColor: STATUS_COLOR[r.status],
                    }}
                    title={`${r.name} · ${formatPKRShort(r.escalatedCost)}`}
                  >
                    {labelInside ? (
                      <span className="flex min-w-0 items-baseline gap-2">
                        <span className="truncate">{r.name}</span>
                        <span className="shrink-0 text-white/75 tabular">
                          {formatPKRShort(r.escalatedCost)}
                        </span>
                      </span>
                    ) : (
                      <span className="sr-only">{r.name}</span>
                    )}
                  </div>
                  {/* External label for short bars */}
                  {!labelInside && (
                    <div
                      className="absolute top-0 flex h-9 items-center whitespace-nowrap pl-2 text-[12px] font-medium text-foreground"
                      style={{ left: `${left + width}%`, maxWidth: `${100 - (left + width)}%` }}
                    >
                      <span className="truncate">{r.name}</span>
                      <span className="ml-2 shrink-0 text-subtle tabular">
                        {formatPKRShort(r.escalatedCost)}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 border-t border-border pt-3">
        {(["draft", "submitted", "won", "lost"] as ProjectStatus[]).map((s) => (
          <span key={s} className="flex items-center gap-1.5 text-[11px] capitalize text-subtle">
            <span
              className="size-2.5 rounded-sm"
              style={{ backgroundColor: STATUS_COLOR[s] }}
              aria-hidden
            />
            {s}
          </span>
        ))}
      </div>
    </div>
  );
}
