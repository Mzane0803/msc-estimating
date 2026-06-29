"use client";

import type { EscalationScenario } from "@/lib/types";
import { cn } from "@/lib/utils";

const OPTIONS: { value: EscalationScenario; label: string; hint: string }[] = [
  { value: "base", label: "Base", hint: "Rates as entered" },
  { value: "high", label: "High inflation", hint: "Broad rates 1.5× hotter" },
  { value: "shock", label: "Devaluation shock", hint: "FX 2.5×, imports surge" },
];

export function ScenarioToggle({
  scenario,
  onChange,
}: {
  scenario: EscalationScenario;
  onChange: (s: EscalationScenario) => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Escalation scenario"
      className="inline-flex items-center gap-0.5 rounded-lg border border-border bg-surface-muted p-0.5"
    >
      {OPTIONS.map((o) => {
        const active = o.value === scenario;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            title={o.hint}
            onClick={() => onChange(o.value)}
            className={cn(
              "rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors",
              active
                ? "bg-accent text-accent-fg shadow-sm shadow-[rgba(79,70,229,0.18)]"
                : "text-muted hover:text-foreground",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
