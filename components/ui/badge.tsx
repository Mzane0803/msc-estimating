import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium tracking-tight",
  {
    variants: {
      tone: {
        neutral: "border-border-strong bg-surface-muted text-muted",
        accent: "border-transparent bg-accent-muted text-accent",
        pos: "border-transparent bg-pos-bg text-pos",
        neg: "border-transparent bg-neg-bg text-neg",
        warn: "border-transparent bg-warn-bg text-warn",
      },
    },
    defaultVariants: { tone: "neutral" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, tone, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}
