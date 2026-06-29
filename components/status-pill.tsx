import { Badge } from "@/components/ui/badge";
import type { ProjectStatus } from "@/lib/types";

const MAP: Record<
  ProjectStatus,
  { label: string; tone: "neutral" | "accent" | "pos" | "neg" | "warn"; dot: string }
> = {
  draft: { label: "Draft", tone: "neutral", dot: "#9a9aa0" },
  submitted: { label: "Submitted", tone: "accent", dot: "#4f46e5" },
  won: { label: "Won", tone: "pos", dot: "#15803d" },
  lost: { label: "Lost", tone: "neg", dot: "#b42318" },
  archived: { label: "Archived", tone: "neutral", dot: "#c4c4c8" },
};

export function StatusPill({ status }: { status: ProjectStatus }) {
  const s = MAP[status];
  return (
    <Badge tone={s.tone}>
      <span className="size-1.5 rounded-full" style={{ backgroundColor: s.dot }} aria-hidden />
      {s.label}
    </Badge>
  );
}
