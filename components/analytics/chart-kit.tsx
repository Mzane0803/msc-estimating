"use client";

import type { ReactNode } from "react";

/** Shared restrained tooltip shell — matches the donut/bid-summary styling. */
export function ChartTooltip({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border bg-surface px-3 py-2 text-xs shadow-sm">
      <div className="font-medium">{title}</div>
      <div className="mt-0.5 tabular">{children}</div>
    </div>
  );
}

/** Token colors reused across the analytics charts. */
export const CHART = {
  accent: "#4f46e5",
  accentDeep: "#312e81",
  muted: "#c7d2fe",
  grid: "#ececec",
  axis: "#9a9aa0",
  pos: "#15803d",
  neg: "#b42318",
} as const;

/** Standard tick props so every axis reads the same. */
export const tickStyle = {
  fontSize: 11,
  fill: CHART.axis,
} as const;
