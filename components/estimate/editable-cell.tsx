"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Move focus to the previous/next input sharing the same `data-col` value,
 * in DOM order. Powers Enter / Shift+Enter / Arrow up-down between rows.
 */
function moveFocus(el: HTMLElement, col: string, dir: 1 | -1) {
  const all = Array.from(
    document.querySelectorAll<HTMLElement>(`[data-col="${col}"]`),
  );
  const idx = all.indexOf(el);
  const next = all[idx + dir];
  if (next) {
    next.focus();
    (next as HTMLInputElement).select?.();
  }
}

interface NumericCellProps {
  value: number;
  onCommit: (value: number) => void;
  col: string;
  /** Format for display when not focused (e.g. money). */
  format?: (v: number) => string;
  align?: "right" | "left";
  prefix?: string;
  step?: number;
  className?: string;
}

/** A number cell that shows formatted text, becomes a raw input on focus. */
export function NumericCell({
  value,
  onCommit,
  col,
  format,
  align = "right",
  prefix,
  step = 1,
  className,
}: NumericCellProps) {
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(String(value));

  React.useEffect(() => {
    if (!editing) setDraft(String(value));
  }, [value, editing]);

  const commit = (raw: string) => {
    const n = parseFloat(raw);
    onCommit(Number.isFinite(n) ? n : 0);
  };

  return (
    <div
      className={cn(
        "edit-focus group/cell relative -mx-1 rounded-sm px-1",
        className,
      )}
    >
      <input
        data-col={col}
        inputMode="decimal"
        step={step}
        value={editing ? draft : format ? format(value) : String(value)}
        onFocus={(e) => {
          setEditing(true);
          setDraft(String(value));
          requestAnimationFrame(() => e.target.select());
        }}
        onBlur={(e) => {
          setEditing(false);
          commit(e.target.value);
        }}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commit((e.target as HTMLInputElement).value);
            moveFocus(e.currentTarget, col, e.shiftKey ? -1 : 1);
          } else if (e.key === "ArrowDown") {
            e.preventDefault();
            moveFocus(e.currentTarget, col, 1);
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            moveFocus(e.currentTarget, col, -1);
          } else if (e.key === "Escape") {
            setEditing(false);
            setDraft(String(value));
            (e.target as HTMLInputElement).blur();
          }
        }}
        className={cn(
          "w-full bg-transparent py-1.5 text-[13px] tabular outline-none",
          "rounded-sm transition-colors hover:bg-surface-muted focus:bg-surface focus:hover:bg-surface",
          align === "right" ? "text-right" : "text-left",
        )}
      />
      {prefix && !editing && (
        <span className="pointer-events-none absolute left-1 top-1/2 -translate-y-1/2 text-[13px] text-subtle">
          {prefix}
        </span>
      )}
    </div>
  );
}

/** A free-text cell (line item description). */
export function TextCell({
  value,
  onCommit,
  col,
  className,
}: {
  value: string;
  onCommit: (value: string) => void;
  col: string;
  className?: string;
}) {
  const [draft, setDraft] = React.useState(value);
  React.useEffect(() => setDraft(value), [value]);

  return (
    <div className="edit-focus -mx-1 rounded-sm px-1">
      <input
        data-col={col}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => onCommit(draft)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            onCommit(draft);
            moveFocus(e.currentTarget, col, e.shiftKey ? -1 : 1);
          } else if (e.key === "Escape") {
            setDraft(value);
            (e.target as HTMLInputElement).blur();
          }
        }}
        className={cn(
          "w-full truncate rounded-sm bg-transparent py-1.5 text-[13px] outline-none transition-colors hover:bg-surface-muted focus:bg-surface",
          className,
        )}
      />
    </div>
  );
}
