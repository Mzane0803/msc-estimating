"use client";

import { SlidersHorizontal } from "lucide-react";
import type { EscalationAssumptions, EscalationIndex } from "@/lib/types";
import { rateFor } from "@/lib/escalation";
import { percent } from "@/lib/format";

export function AssumptionsEditor({
  escalation,
  onIndexChange,
  onImportedShareChange,
}: {
  escalation: EscalationAssumptions;
  onIndexChange: (key: EscalationIndex["key"], annualPct: number) => void;
  onImportedShareChange: (importedShare: number) => void;
}) {
  const scenarioActive = escalation.scenario !== "base";

  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className="flex items-center gap-2">
        <SlidersHorizontal className="size-4 text-accent" />
        <span className="text-sm font-semibold tracking-tight">Escalation assumptions</span>
        <span className="ml-auto text-[11px] text-subtle">annual %</span>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-x-6 gap-y-3.5 sm:grid-cols-2">
        {escalation.indices.map((idx) => {
          const entered = idx.annualPct;
          const effective = rateFor(escalation, idx.key);
          const scaled = scenarioActive && Math.abs(effective - entered) > 1e-9;
          return (
            <div key={idx.key} className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <label
                  htmlFor={`idx-${idx.key}`}
                  className="block truncate text-[13px] font-medium text-foreground"
                >
                  {idx.label}
                </label>
                <span className="text-[11px] text-subtle tabular">
                  {scaled ? (
                    <>
                      effective{" "}
                      <span className="font-medium text-muted">{percent(effective, 1)}</span>
                    </>
                  ) : (
                    "as entered"
                  )}
                </span>
              </div>
              <div className="relative shrink-0">
                <input
                  id={`idx-${idx.key}`}
                  type="number"
                  inputMode="decimal"
                  step={0.5}
                  min={0}
                  max={100}
                  value={round1(entered * 100)}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value);
                    onIndexChange(idx.key, Number.isFinite(v) ? v / 100 : 0);
                  }}
                  className="h-8 w-20 rounded-md border border-border-strong bg-surface pl-2.5 pr-6 text-right text-[13px] font-medium tabular focus:outline-none focus:ring-2 focus:ring-[var(--accent-ring)]"
                />
                <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-[12px] text-subtle">
                  %
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Imported material share */}
      <div className="mt-5 border-t border-dashed border-border-strong pt-4">
        <div className="flex items-baseline justify-between">
          <label htmlFor="imported-share" className="text-[13px] font-medium text-foreground">
            Imported material share
          </label>
          <span className="text-[13px] font-semibold tabular">
            {percent(escalation.importedShare, 0)}
          </span>
        </div>
        <input
          id="imported-share"
          type="range"
          min={0}
          max={0.4}
          step={0.01}
          value={escalation.importedShare}
          onChange={(e) => onImportedShareChange(parseFloat(e.target.value))}
          className="mt-2 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-surface-muted accent-[var(--accent)]"
        />
        <p className="mt-2 text-[11px] leading-snug text-subtle">
          Share of material cost that is import-linked — this portion escalates by FX
          (PKR devaluation) instead of its domestic index.
        </p>
      </div>
    </div>
  );
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
