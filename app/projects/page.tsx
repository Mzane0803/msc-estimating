"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus,
  Search,
  MoreHorizontal,
  Copy,
  Pencil,
  Archive,
  ArchiveRestore,
  Trash2,
  Download,
  Upload,
  RotateCcw,
  GitCompare,
  ArrowUpRight,
} from "lucide-react";
import type { Project, ProjectStatus, ProjectType } from "@/lib/types";
import { computeBid } from "@/lib/estimate";
import { pecCeiling } from "@/lib/trades";
import { formatPKR, formatPKRShort, formatQty } from "@/lib/format";
import { useStore } from "@/components/store/store-provider";
import { StatusPill } from "@/components/status-pill";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { cn } from "@/lib/utils";

const TYPE_LABEL: Record<ProjectType, string> = {
  commercial: "Commercial",
  residential: "Residential",
  civil: "Civil",
  industrial: "Industrial",
};

const STATUS_FILTERS: (ProjectStatus | "all")[] = ["all", "draft", "submitted", "won", "lost"];

export default function ProjectsPage() {
  const store = useStore();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<ProjectStatus | "all">("all");
  const [showArchived, setShowArchived] = useState(false);
  const [menuId, setMenuId] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<Project | null>(null);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return store.projects
      .filter((p) => (showArchived ? true : p.status !== "archived"))
      .filter((p) => (status === "all" ? true : p.status === status))
      .filter((p) =>
        q ? `${p.name} ${p.client} ${p.location}`.toLowerCase().includes(q) : true,
      )
      .map((p) => {
        const bid = computeBid(p);
        const contractor = store.getContractor(p.contractorId);
        const ceiling = contractor ? pecCeiling(contractor.pecCategory) : Infinity;
        return { project: p, bid, exceeds: bid.bidTotal > ceiling };
      });
  }, [store, query, status, showArchived]);

  const onImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        store.importData(String(reader.result));
      } catch (err) {
        alert("Could not import: " + (err as Error).message);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const onExport = () => {
    const blob = new Blob([store.exportData()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bidkar-backup.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-border bg-background/85 px-6 backdrop-blur">
        <h1 className="text-[15px] font-semibold tracking-tight">Projects</h1>
        <span className="rounded-full bg-surface-muted px-2 py-0.5 text-[11px] font-medium tabular text-muted">
          {rows.length}
        </span>
        <div className="ml-auto flex items-center gap-2">
          <Link href="/compare">
            <Button variant="ghost" size="sm">
              <GitCompare />
              Compare
            </Button>
          </Link>
          <DataMenu onExport={onExport} onImport={() => fileRef.current?.click()} onReset={() => store.resetData()} />
          <Link href="/projects/new">
            <Button size="sm">
              <Plus />
              New project
            </Button>
          </Link>
        </div>
        <input ref={fileRef} type="file" accept="application/json" hidden onChange={onImport} />
      </header>

      <div className="mx-auto w-full max-w-[1180px] px-6 py-6">
        {/* Toolbar */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <div className="flex h-9 flex-1 items-center gap-2 rounded-lg border border-border bg-surface px-3">
            <Search className="size-4 text-subtle" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search projects, clients, locations…"
              className="h-full flex-1 bg-transparent text-[13px] outline-none placeholder:text-subtle"
            />
          </div>
          <div className="flex items-center gap-1 rounded-lg border border-border bg-surface p-0.5">
            {STATUS_FILTERS.map((s) => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                className={cn(
                  "rounded-md px-2.5 py-1 text-[12px] font-medium capitalize transition-colors",
                  status === s ? "bg-surface-muted text-foreground" : "text-muted hover:text-foreground",
                )}
              >
                {s}
              </button>
            ))}
          </div>
          <label className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-2 text-[12px] text-muted">
            <input type="checkbox" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} className="accent-[var(--accent)]" />
            Archived
          </label>
        </div>

        {rows.length === 0 ? (
          <EmptyState hasProjects={store.projects.length > 0} />
        ) : (
          <div className="overflow-hidden rounded-xl border border-border bg-surface">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-[11px] font-medium uppercase tracking-wide text-subtle">
                  <th className="px-5 py-2.5 font-medium">Project</th>
                  <th className="hidden px-3 py-2.5 font-medium md:table-cell">Type</th>
                  <th className="px-3 py-2.5 font-medium">Status</th>
                  <th className="hidden px-3 py-2.5 text-right font-medium lg:table-cell">Area (Sft)</th>
                  <th className="px-3 py-2.5 text-right font-medium">Rs / Sft</th>
                  <th className="px-3 py-2.5 text-right font-medium">Bid value</th>
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody>
                {rows.map(({ project, bid, exceeds }) => (
                  <tr key={project.id} className="group border-b border-border last:border-0 hover:bg-surface-muted/60">
                    <td className="px-5 py-3">
                      <Link href={`/project?p=${project.id}`} className="block">
                        <span className="flex items-center gap-2 font-medium leading-tight">
                          {project.name}
                          {exceeds && (
                            <span className="rounded bg-warn-bg px-1 py-px text-[9px] font-medium uppercase text-warn">
                              PEC
                            </span>
                          )}
                        </span>
                        <span className="text-[12px] text-subtle">
                          {project.client} · {project.location}
                        </span>
                      </Link>
                    </td>
                    <td className="hidden px-3 text-muted md:table-cell">{TYPE_LABEL[project.type]}</td>
                    <td className="px-3"><StatusPill status={project.status} /></td>
                    <td className="hidden px-3 text-right tabular text-muted lg:table-cell">{formatQty(project.area)}</td>
                    <td className="px-3 text-right tabular text-muted">{formatPKR(bid.costPerSft)}</td>
                    <td className="px-3 text-right">
                      <span className="font-medium tabular">{formatPKR(bid.bidTotal)}</span>
                      <span className="block text-[11px] tabular text-subtle">{formatPKRShort(bid.bidTotal)}</span>
                    </td>
                    <td className="relative pr-4">
                      <button
                        onClick={() => setMenuId(menuId === project.id ? null : project.id)}
                        className="flex size-7 items-center justify-center rounded-md text-subtle opacity-0 transition hover:bg-surface-muted hover:text-foreground group-hover:opacity-100 data-[open=true]:opacity-100"
                        data-open={menuId === project.id}
                      >
                        <MoreHorizontal className="size-4" />
                      </button>
                      {menuId === project.id && (
                        <RowMenu
                          project={project}
                          onClose={() => setMenuId(null)}
                          onOpen={() => router.push(`/project?p=${project.id}`)}
                          onEdit={() => router.push(`/project/edit?p=${project.id}`)}
                          onDuplicate={() => {
                            const c = store.duplicateProject(project.id);
                            setMenuId(null);
                            if (c) router.push(`/project/edit?p=${c.id}`);
                          }}
                          onArchive={() =>
                            store.setProjectStatus(
                              project.id,
                              project.status === "archived" ? "draft" : "archived",
                            )
                          }
                          onDelete={() => {
                            setToDelete(project);
                            setMenuId(null);
                          }}
                        />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!toDelete}
        title="Delete project?"
        message={`“${toDelete?.name}” and its entire BOQ will be permanently removed. This cannot be undone.`}
        onConfirm={() => {
          if (toDelete) store.deleteProject(toDelete.id);
          setToDelete(null);
        }}
        onCancel={() => setToDelete(null)}
      />
    </>
  );
}

function RowMenu({
  project,
  onClose,
  onOpen,
  onEdit,
  onDuplicate,
  onArchive,
  onDelete,
}: {
  project: Project;
  onClose: () => void;
  onOpen: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onArchive: () => void;
  onDelete: () => void;
}) {
  const item =
    "flex w-full items-center gap-2.5 px-3 py-1.5 text-left text-[13px] text-foreground hover:bg-surface-muted";
  return (
    <>
      <div className="fixed inset-0 z-10" onClick={onClose} />
      <div className="absolute right-4 top-9 z-20 w-44 overflow-hidden rounded-lg border border-border bg-surface py-1 shadow-lg shadow-black/10 animate-fade-in">
        <button className={item} onClick={onOpen}><ArrowUpRight className="size-3.5 text-subtle" />Open</button>
        <button className={item} onClick={onEdit}><Pencil className="size-3.5 text-subtle" />Edit details</button>
        <button className={item} onClick={onDuplicate}><Copy className="size-3.5 text-subtle" />Duplicate</button>
        <button className={item} onClick={onArchive}>
          {project.status === "archived" ? <ArchiveRestore className="size-3.5 text-subtle" /> : <Archive className="size-3.5 text-subtle" />}
          {project.status === "archived" ? "Unarchive" : "Archive"}
        </button>
        <div className="my-1 border-t border-border" />
        <button className={cn(item, "text-neg hover:bg-neg-bg")} onClick={onDelete}>
          <Trash2 className="size-3.5" />Delete
        </button>
      </div>
    </>
  );
}

function DataMenu({
  onExport,
  onImport,
  onReset,
}: {
  onExport: () => void;
  onImport: () => void;
  onReset: () => void;
}) {
  const [open, setOpen] = useState(false);
  const item = "flex w-full items-center gap-2.5 px-3 py-1.5 text-left text-[13px] hover:bg-surface-muted";
  return (
    <div className="relative">
      <Button variant="outline" size="sm" onClick={() => setOpen((o) => !o)}>
        Data
      </Button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-9 z-20 w-44 overflow-hidden rounded-lg border border-border bg-surface py-1 shadow-lg shadow-black/10 animate-fade-in">
            <button className={item} onClick={() => { onExport(); setOpen(false); }}><Download className="size-3.5 text-subtle" />Export JSON</button>
            <button className={item} onClick={() => { onImport(); setOpen(false); }}><Upload className="size-3.5 text-subtle" />Import JSON</button>
            <div className="my-1 border-t border-border" />
            <button className={cn(item, "text-neg hover:bg-neg-bg")} onClick={() => { onReset(); setOpen(false); }}>
              <RotateCcw className="size-3.5" />Reset to seed
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function EmptyState({ hasProjects }: { hasProjects: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border-strong bg-surface py-16 text-center">
      <div className="flex size-10 items-center justify-center rounded-full bg-surface-muted text-subtle">
        <Search className="size-5" />
      </div>
      <p className="text-sm text-muted">
        {hasProjects ? "No projects match your filters." : "No projects yet."}
      </p>
      <Link href="/projects/new">
        <Button size="sm"><Plus />New project</Button>
      </Link>
    </div>
  );
}
