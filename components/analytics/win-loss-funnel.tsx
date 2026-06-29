"use client";

import { useMemo } from "react";
import {
  Bar,
  BarChart,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Trophy, Wallet, CircleDollarSign, Ruler } from "lucide-react";
import type { Project } from "@/lib/types";
import { computeBid } from "@/lib/estimate";
import { formatPKR, formatPKRShort, formatPKRPrecise, percent } from "@/lib/format";
import { CHART, ChartTooltip, tickStyle } from "./chart-kit";

interface FunnelRow {
  stage: string;
  count: number;
  value: number;
  fill: string;
}

/**
 * Chart 6 — Win/loss funnel + win-rate KPIs across all (non-archived) projects.
 */
export function WinLossFunnel({ projects }: { projects: Project[] }) {
  const stats = useMemo(() => {
    let won = 0;
    let lost = 0;
    let draft = 0;
    let submitted = 0;
    let pipelineValue = 0;
    let wonValue = 0;
    let psftSum = 0;
    let psftCount = 0;

    for (const p of projects) {
      const bid = computeBid(p);
      if (bid.costPerSft > 0) {
        psftSum += bid.costPerSft;
        psftCount += 1;
      }
      switch (p.status) {
        case "won":
          won += 1;
          wonValue += bid.bidTotal;
          break;
        case "lost":
          lost += 1;
          break;
        case "draft":
          draft += 1;
          pipelineValue += bid.bidTotal;
          break;
        case "submitted":
          submitted += 1;
          pipelineValue += bid.bidTotal;
          break;
      }
    }

    const decided = won + lost;
    return {
      won,
      lost,
      draft,
      submitted,
      pipelineValue,
      wonValue,
      winRate: decided > 0 ? won / decided : 0,
      avgPsft: psftCount > 0 ? psftSum / psftCount : 0,
    };
  }, [projects]);

  // Funnel: draft → submitted → won. Lost is shown separately below.
  const funnel = useMemo<FunnelRow[]>(() => {
    const valueByStage = projects.reduce(
      (acc, p) => {
        const v = computeBid(p).bidTotal;
        if (p.status === "draft") acc.draft += v;
        else if (p.status === "submitted") acc.submitted += v;
        else if (p.status === "won") acc.won += v;
        return acc;
      },
      { draft: 0, submitted: 0, won: 0 },
    );
    return [
      { stage: "Draft", count: stats.draft, value: valueByStage.draft, fill: CHART.muted },
      { stage: "Submitted", count: stats.submitted, value: valueByStage.submitted, fill: CHART.accent },
      { stage: "Won", count: stats.won, value: valueByStage.won, fill: CHART.accentDeep },
    ];
  }, [projects, stats]);

  return (
    <div>
      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi
          icon={<Trophy className="size-4" />}
          label="Win rate"
          value={percent(stats.winRate, 0)}
          sub={`${stats.won} won · ${stats.lost} lost`}
        />
        <Kpi
          icon={<Wallet className="size-4" />}
          label="Pipeline value"
          value={formatPKRShort(stats.pipelineValue)}
          sub="Drafts + submitted"
        />
        <Kpi
          icon={<CircleDollarSign className="size-4" />}
          label="Total won"
          value={formatPKRShort(stats.wonValue)}
          sub={`${stats.won} awarded`}
        />
        <Kpi
          icon={<Ruler className="size-4" />}
          label="Avg cost / Sft"
          value={formatPKRPrecise(stats.avgPsft)}
          sub="Across portfolio"
        />
      </div>

      {/* Funnel of counts by stage */}
      <div className="mt-4 h-[180px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            layout="vertical"
            data={funnel}
            margin={{ top: 4, right: 40, bottom: 4, left: 4 }}
            barCategoryGap="26%"
          >
            <XAxis
              type="number"
              allowDecimals={false}
              tick={tickStyle}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              type="category"
              dataKey="stage"
              tick={tickStyle}
              tickLine={false}
              axisLine={false}
              width={76}
            />
            <Tooltip
              cursor={{ fill: "rgba(79,70,229,0.06)" }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const row = payload[0].payload as FunnelRow;
                return (
                  <ChartTooltip title={row.stage}>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{row.count}</span>
                      <span className="text-subtle">
                        {row.count === 1 ? "project" : "projects"} ·{" "}
                        {formatPKR(row.value)}
                      </span>
                    </div>
                  </ChartTooltip>
                );
              }}
            />
            <Bar dataKey="count" radius={[0, 3, 3, 0]} maxBarSize={30}>
              {funnel.map((r) => (
                <Cell key={r.stage} fill={r.fill} />
              ))}
              <LabelList
                dataKey="count"
                position="right"
                fontSize={11}
                fill={CHART.axis}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-1 flex items-center gap-2 px-1 text-[11px] text-subtle">
        <span
          className="size-2.5 rounded-[3px]"
          style={{ backgroundColor: CHART.neg }}
        />
        Lost: <span className="tabular text-muted">{stats.lost}</span> shown
        separately — not part of the active funnel.
      </div>
    </div>
  );
}

function Kpi({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface-muted/40 p-3.5">
      <div className="flex items-center gap-2 text-subtle">
        <span className="text-accent">{icon}</span>
        <span className="text-[11px] font-medium text-muted">{label}</span>
      </div>
      <div className="mt-1.5 text-xl font-semibold tracking-tight tabular">
        {value}
      </div>
      <div className="mt-0.5 text-[11px] text-subtle">{sub}</div>
    </div>
  );
}
