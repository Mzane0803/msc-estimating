"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FolderKanban,
  BookOpen,
  BarChart3,
  CalendarRange,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CommandPalette, useCommandPalette } from "@/components/command-palette";
import { MscLogo } from "@/components/msc-logo";

const NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/rates", label: "Rate Library", icon: BookOpen },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/portfolio", label: "Portfolio & Escalation", icon: CalendarRange },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const palette = useCommandPalette();

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-surface md:flex">
        <Link
          href="/"
          className="flex h-16 items-center justify-between border-b border-border px-5 text-foreground"
        >
          <MscLogo height={38} />
          <span className="text-[9px] font-medium uppercase tracking-wide text-subtle">
            Estimating
          </span>
        </Link>

        <div className="px-3 pt-3">
          <button
            onClick={palette.open}
            className="flex w-full items-center gap-2 rounded-lg border border-border bg-surface-muted px-2.5 py-1.5 text-[13px] text-subtle transition-colors hover:text-foreground"
          >
            <Search className="size-3.5" />
            Search…
            <kbd className="ml-auto rounded border border-border-strong bg-surface px-1 py-px text-[10px] font-medium text-subtle tabular">
              ⌘K
            </kbd>
          </button>
        </div>

        <nav className="flex-1 space-y-0.5 p-3">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href, item.exact);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[13px] font-medium transition-colors",
                  active
                    ? "bg-surface-muted text-foreground"
                    : "text-muted hover:bg-surface-muted hover:text-foreground",
                )}
              >
                <Icon className={cn("size-4", active ? "text-accent" : "text-subtle")} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-border p-3">
          <div className="flex items-center justify-center gap-1.5 text-[10px] tracking-wide">
            <span className="uppercase text-subtle">Crafted by</span>
            <span className="font-medium text-foreground">Tamoor Salman</span>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">{children}</div>
      <CommandPalette controller={palette} />
    </div>
  );
}
