"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  FolderKanban,
  FileText,
  BookOpen,
  LayoutDashboard,
  BarChart3,
  CalendarRange,
  CornerDownLeft,
} from "lucide-react";
import { useStore } from "@/components/store/store-provider";
import { tradeName } from "@/lib/trades";
import { cn } from "@/lib/utils";

export interface PaletteController {
  isOpen: boolean;
  open: () => void;
  close: () => void;
}

/** Global ⌘K / Ctrl-K handler. */
export function useCommandPalette(): PaletteController {
  const [isOpen, setIsOpen] = useState(false);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  return {
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
  };
}

interface Result {
  id: string;
  label: string;
  sub: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  group: string;
}

const PAGES: Result[] = [
  { id: "p-dash", label: "Dashboard", sub: "Portfolio overview", href: "/", icon: LayoutDashboard, group: "Pages" },
  { id: "p-proj", label: "Projects", sub: "All estimates", href: "/projects", icon: FolderKanban, group: "Pages" },
  { id: "p-rate", label: "Rate Library", sub: "Master unit rates", href: "/rates", icon: BookOpen, group: "Pages" },
  { id: "p-anal", label: "Analytics", sub: "Charts & analysis", href: "/analytics", icon: BarChart3, group: "Pages" },
  { id: "p-port", label: "Portfolio & Escalation", sub: "Multi-year modeling", href: "/portfolio", icon: CalendarRange, group: "Pages" },
];

export function CommandPalette({ controller }: { controller: PaletteController }) {
  const { isOpen, close } = controller;
  const router = useRouter();
  const { projects, rates } = useStore();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setActive(0);
    }
  }, [isOpen]);

  const results = useMemo<Result[]>(() => {
    const q = query.trim().toLowerCase();
    const projectResults: Result[] = projects.map((p) => ({
      id: `proj-${p.id}`,
      label: p.name,
      sub: `${p.client} · ${p.location}`,
      href: `/project?p=${p.id}`,
      icon: FolderKanban,
      group: "Projects",
    }));
    const lineResults: Result[] = projects.flatMap((p) =>
      p.lineItems.map((li) => ({
        id: `li-${li.id}`,
        label: li.description,
        sub: `${p.name} · ${tradeName(li.tradeId)} · ${li.itemCode}`,
        href: `/project?p=${p.id}`,
        icon: FileText,
        group: "Line items",
      })),
    );
    const rateResults: Result[] = rates.map((r) => ({
      id: `rate-${r.id}`,
      label: r.description,
      sub: `Rate Library · ${tradeName(r.tradeId)} · ${r.itemCode}`,
      href: `/rates`,
      icon: BookOpen,
      group: "Rates",
    }));

    const all = [...PAGES, ...projectResults, ...lineResults, ...rateResults];
    if (!q) return [...PAGES, ...projectResults].slice(0, 8);
    return all
      .filter((r) => (r.label + " " + r.sub).toLowerCase().includes(q))
      .slice(0, 12);
  }, [query, projects, rates]);

  const go = useCallback(
    (r: Result) => {
      close();
      router.push(r.href);
    },
    [close, router],
  );

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/20 p-4 pt-[12vh] backdrop-blur-sm"
      onClick={close}
    >
      <div
        className="w-full max-w-xl overflow-hidden rounded-xl border border-border bg-surface shadow-xl shadow-black/10 animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2.5 border-b border-border px-4">
          <Search className="size-4 text-subtle" />
          <input
            autoFocus
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActive((a) => Math.min(a + 1, results.length - 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActive((a) => Math.max(a - 1, 0));
              } else if (e.key === "Enter" && results[active]) {
                go(results[active]);
              } else if (e.key === "Escape") {
                close();
              }
            }}
            placeholder="Search projects, line items, rates…"
            className="h-12 flex-1 bg-transparent text-sm outline-none placeholder:text-subtle"
          />
          <kbd className="rounded border border-border-strong px-1.5 py-0.5 text-[10px] text-subtle">
            ESC
          </kbd>
        </div>

        <div className="max-h-[50vh] overflow-y-auto p-2">
          {results.length === 0 && (
            <div className="px-3 py-8 text-center text-sm text-subtle">
              No matches for “{query}”
            </div>
          )}
          {results.map((r, i) => {
            const Icon = r.icon;
            return (
              <button
                key={r.id}
                onMouseEnter={() => setActive(i)}
                onClick={() => go(r)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left",
                  i === active ? "bg-surface-muted" : "",
                )}
              >
                <Icon className="size-4 shrink-0 text-subtle" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-medium">{r.label}</span>
                  <span className="block truncate text-[11px] text-subtle">{r.sub}</span>
                </span>
                <span className="shrink-0 rounded bg-surface-muted px-1.5 py-0.5 text-[10px] text-subtle">
                  {r.group}
                </span>
                {i === active && <CornerDownLeft className="size-3.5 shrink-0 text-subtle" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
