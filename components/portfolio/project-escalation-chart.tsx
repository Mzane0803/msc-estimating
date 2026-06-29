"use client";

import { useMemo } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { EscalationAssumptions, Project } from "@/lib/types";
import { projectEscalation } from "@/lib/escalation";
import { formatPKR, pkrShortBare } from "@/lib/format";
import { EmptyChart } from "./portfolio-area-chart";

const SERIES: { key: "base" | "nominal" | "real"; label: string; color: string; dash?: string }[] = [
  { key: "base", label: "Base", color: "#9a9aa0", dash: "4 4" },
  { key: "nominal", label: "Nominal", color: "#4f46e5" },
  { key: "real", label: "Real", color: "#15803d" },
];

export function ProjectEscalationChart({
  projects,
  escalation,
  selectedId,
  onSelect,
}: {
  projects: Project[];
  escalation: EscalationAssumptions;
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const project = projects.find((p) => p.id === selectedId) ?? projects[0];

  const data = useMemo(() => {
    if (!project) return [];
    return projectEscalation(project, escalation).byYear.map((y) => ({
      year: y.year,
      base: y.base,
      nominal: y.nominal,
      real: y.real,
    }));
  }, [project, escalation]);

  return (
    <div>
      <div className="mb-3">
        <select
          aria-label="Select project"
          value={project?.id ?? ""}
          onChange={(e) => onSelect(e.target.value)}
          className="h-8 max-w-full rounded-md border border-border-strong bg-surface px-2.5 text-[13px] font-medium focus:outline-none focus:ring-2 focus:ring-[var(--accent-ring)]"
        >
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      {!project || !data.length ? (
        <EmptyChart message="Select a project with a schedule to see its cost path." />
      ) : (
        <>
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 4 }}>
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis
                  dataKey="year"
                  tickLine={false}
                  axisLine={{ stroke: "var(--border-strong)" }}
                  tick={{ fontSize: 11, fill: "var(--subtle)" }}
                />
                <YAxis
                  width={52}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: "var(--subtle)" }}
                  tickFormatter={(v: number) => pkrShortBare(v)}
                />
                <Tooltip cursor={{ stroke: "var(--border-strong)" }} content={<LineTooltip />} />
                {SERIES.map((s) => (
                  <Line
                    key={s.key}
                    type="monotone"
                    dataKey={s.key}
                    name={s.label}
                    stroke={s.color}
                    strokeWidth={s.key === "nominal" ? 2 : 1.5}
                    strokeDasharray={s.dash}
                    dot={false}
                    isAnimationActive
                    animationDuration={400}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
          <Legend />
        </>
      )}
    </div>
  );
}

interface TooltipPayloadItem {
  dataKey?: string | number;
  value?: number;
}

function LineTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string | number;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-surface px-3 py-2 text-xs shadow-sm">
      <div className="font-medium tabular">{label}</div>
      <dl className="mt-1 space-y-0.5 tabular">
        {SERIES.map((s) => {
          const v = payload.find((p) => p.dataKey === s.key)?.value ?? 0;
          return (
            <div key={s.key} className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 text-subtle">
                <span className="size-2 rounded-full" style={{ backgroundColor: s.color }} aria-hidden />
                {s.label}
              </span>
              <span className="font-medium">{formatPKR(v)}</span>
            </div>
          );
        })}
      </dl>
    </div>
  );
}

function Legend() {
  return (
    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 border-t border-border pt-3">
      {SERIES.map((s) => (
        <span key={s.key} className="flex items-center gap-1.5 text-[11px] text-subtle">
          <span className="h-0.5 w-4 rounded-full" style={{ backgroundColor: s.color }} aria-hidden />
          {s.label}
          {s.key === "real" && " (CPI-deflated)"}
        </span>
      ))}
    </div>
  );
}
