"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Plus } from "lucide-react";
import type { PecCategory, Project, ProjectType, ProvinceId } from "@/lib/types";
import { CSR_SCHEDULES, PEC_CATEGORIES, PROVINCES } from "@/lib/trades";
import { useStore } from "@/components/store/store-provider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const TYPES: ProjectType[] = ["commercial", "residential", "civil", "industrial"];

export function ProjectForm({ project }: { project?: Project }) {
  const store = useStore();
  const router = useRouter();
  const editing = !!project;

  const [form, setForm] = useState({
    name: project?.name ?? "",
    client: project?.client ?? "",
    location: project?.location ?? "",
    province: project?.province ?? ("punjab" as ProvinceId),
    type: project?.type ?? ("commercial" as ProjectType),
    csrSchedule: project?.csrSchedule ?? CSR_SCHEDULES[0],
    contractorId: project?.contractorId ?? store.contractors[0]?.id ?? "",
    area: project?.area ?? 0,
    landArea: project?.landArea ?? 0,
    landUnit: project?.landUnit ?? ("Marla" as "Marla" | "Kanal"),
    durationMonths: project?.durationMonths ?? 12,
    startDate: project?.startDate ?? new Date().toISOString().slice(0, 10),
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [addingContractor, setAddingContractor] = useState(false);
  const [newCtr, setNewCtr] = useState({ name: "", pecCategory: "C-3" as PecCategory, isFiler: true });

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Project name is required.";
    if (!form.client.trim()) e.client = "Client is required.";
    if (form.area <= 0) e.area = "Covered area must be greater than 0.";
    if (form.durationMonths <= 0) e.durationMonths = "Duration must be at least 1 month.";
    if (!form.contractorId) e.contractorId = "Select or add a contractor.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = () => {
    if (!validate()) return;
    if (editing && project) {
      store.updateProject(project.id, { ...form });
      router.push(`/project?p=${project.id}`);
    } else {
      const created = store.createProject({ ...form });
      router.push(`/project?p=${created.id}`);
    }
  };

  const saveContractor = () => {
    if (!newCtr.name.trim()) return;
    const c = store.createContractor(newCtr);
    set("contractorId", c.id);
    setAddingContractor(false);
    setNewCtr({ name: "", pecCategory: "C-3", isFiler: true });
  };

  return (
    <>
      <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-border bg-background/85 px-6 backdrop-blur">
        <Link href={editing ? `/project?p=${project!.id}` : "/projects"} className="flex items-center gap-1 text-[13px] text-muted hover:text-foreground">
          <ChevronLeft className="size-4" />
          {editing ? "Cancel" : "Projects"}
        </Link>
        <span className="text-border-strong">/</span>
        <h1 className="text-[15px] font-semibold tracking-tight">
          {editing ? "Edit project" : "New project"}
        </h1>
      </header>

      <div className="mx-auto w-full max-w-2xl px-6 py-8">
        <div className="space-y-6">
          <Section title="Project details">
            <Field label="Project name" error={errors.name} className="sm:col-span-2">
              <input
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="e.g. Gulberg Corporate Tower"
                className={inputCls(errors.name)}
              />
            </Field>
            <Field label="Client" error={errors.client}>
              <input value={form.client} onChange={(e) => set("client", e.target.value)} className={inputCls(errors.client)} />
            </Field>
            <Field label="Location">
              <input value={form.location} onChange={(e) => set("location", e.target.value)} placeholder="City, area" className={inputCls()} />
            </Field>
            <Field label="Province">
              <select
                value={form.province}
                onChange={(e) => set("province", e.target.value as ProvinceId)}
                className={inputCls()}
              >
                {PROVINCES.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.authority})
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Project type">
              <select value={form.type} onChange={(e) => set("type", e.target.value as ProjectType)} className={inputCls()}>
                {TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t[0].toUpperCase() + t.slice(1)}
                  </option>
                ))}
              </select>
            </Field>
          </Section>

          <Section title="Schedule & contractor">
            <Field label="CSR schedule">
              <select value={form.csrSchedule} onChange={(e) => set("csrSchedule", e.target.value as typeof form.csrSchedule)} className={inputCls()}>
                {CSR_SCHEDULES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </Field>
            <Field label="Contractor" error={errors.contractorId}>
              <div className="flex gap-2">
                <select value={form.contractorId} onChange={(e) => set("contractorId", e.target.value)} className={inputCls(errors.contractorId)}>
                  {store.contractors.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} · {c.pecCategory}
                    </option>
                  ))}
                </select>
                <Button type="button" variant="outline" size="icon" onClick={() => setAddingContractor((v) => !v)} title="Add contractor">
                  <Plus />
                </Button>
              </div>
            </Field>
            {addingContractor && (
              <div className="grid grid-cols-1 gap-3 rounded-lg border border-border bg-surface-muted p-3 sm:col-span-2 sm:grid-cols-[1fr_120px_auto]">
                <input
                  value={newCtr.name}
                  onChange={(e) => setNewCtr((c) => ({ ...c, name: e.target.value }))}
                  placeholder="Contractor name"
                  className={inputCls()}
                />
                <select
                  value={newCtr.pecCategory}
                  onChange={(e) => setNewCtr((c) => ({ ...c, pecCategory: e.target.value as PecCategory }))}
                  className={inputCls()}
                >
                  {PEC_CATEGORIES.map((p) => (
                    <option key={p.id} value={p.id}>{p.label}</option>
                  ))}
                </select>
                <Button type="button" size="sm" onClick={saveContractor}>Add</Button>
              </div>
            )}
          </Section>

          <Section title="Size & duration">
            <Field label="Covered area (Sft)" error={errors.area}>
              <input
                type="number"
                value={form.area || ""}
                onChange={(e) => set("area", parseFloat(e.target.value) || 0)}
                className={cn(inputCls(errors.area), "tabular")}
              />
            </Field>
            <Field label="Land area (optional)">
              <div className="flex gap-2">
                <input
                  type="number"
                  value={form.landArea || ""}
                  onChange={(e) => set("landArea", parseFloat(e.target.value) || 0)}
                  className={cn(inputCls(), "tabular")}
                />
                <select value={form.landUnit} onChange={(e) => set("landUnit", e.target.value as "Marla" | "Kanal")} className={cn(inputCls(), "w-28")}>
                  <option value="Marla">Marla</option>
                  <option value="Kanal">Kanal</option>
                </select>
              </div>
            </Field>
            <Field label="Duration (months)" error={errors.durationMonths}>
              <input
                type="number"
                value={form.durationMonths || ""}
                onChange={(e) => set("durationMonths", parseInt(e.target.value) || 0)}
                className={cn(inputCls(errors.durationMonths), "tabular")}
              />
            </Field>
            <Field label="Start date">
              <input type="date" value={form.startDate} onChange={(e) => set("startDate", e.target.value)} className={cn(inputCls(), "tabular")} />
            </Field>
          </Section>

          <div className="flex justify-end gap-2 border-t border-border pt-5">
            <Link href={editing ? `/project?p=${project!.id}` : "/projects"}>
              <Button variant="outline">Cancel</Button>
            </Link>
            <Button onClick={submit}>{editing ? "Save changes" : "Create project"}</Button>
          </div>
        </div>
      </div>
    </>
  );
}

function inputCls(error?: string): string {
  return cn(
    "h-9 w-full rounded-md border bg-surface px-3 text-[13px] outline-none transition-colors focus:ring-2 focus:ring-[var(--accent-ring)]",
    error ? "border-neg" : "border-border-strong",
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <h2 className="mb-4 text-[13px] font-semibold tracking-tight">{title}</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>
    </div>
  );
}

function Field({
  label,
  error,
  className,
  children,
}: {
  label: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <label className="mb-1.5 block text-[12px] font-medium text-muted">{label}</label>
      {children}
      {error && <p className="mt-1 text-[11px] text-neg">{error}</p>}
    </div>
  );
}
