"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type {
  Contractor,
  EscalationAssumptions,
  EscalationIndex,
  Levies,
  LineItem,
  Markups,
  Project,
  ProjectStatus,
  RateItem,
  TradeId,
} from "@/lib/types";
import {
  type AppData,
  exportJSON,
  importJSON,
  newId,
  repo,
} from "@/lib/store";

interface StoreValue {
  data: AppData;
  projects: Project[];
  contractors: Contractor[];
  rates: RateItem[];
  escalation: EscalationAssumptions;
  getProject: (id: string) => Project | undefined;
  getContractor: (id: string) => Contractor | undefined;

  // projects
  createProject: (input: Partial<Project> & { name: string }) => Project;
  updateProject: (id: string, patch: Partial<Project>) => void;
  duplicateProject: (id: string) => Project | undefined;
  setProjectStatus: (id: string, status: ProjectStatus) => void;
  deleteProject: (id: string) => void;

  // line items
  addLineItem: (projectId: string, tradeId: TradeId, seed?: Partial<LineItem>) => void;
  updateLineItem: (projectId: string, itemId: string, patch: Partial<LineItem>) => void;
  duplicateLineItem: (projectId: string, itemId: string) => void;
  deleteLineItem: (projectId: string, itemId: string) => void;
  moveLineItem: (projectId: string, itemId: string, dir: -1 | 1) => void;

  // markups / levies
  updateMarkups: (projectId: string, patch: Partial<Markups>) => void;
  updateLevies: (projectId: string, patch: Partial<Levies>) => void;

  // contractors
  createContractor: (input: Partial<Contractor> & { name: string }) => Contractor;

  // rates
  addRate: (seed?: Partial<RateItem>) => RateItem;
  updateRate: (id: string, patch: Partial<RateItem>) => void;
  deleteRate: (id: string) => void;

  // escalation
  updateEscalation: (patch: Partial<EscalationAssumptions>) => void;
  updateIndex: (key: EscalationIndex["key"], annualPct: number) => void;

  // data lifecycle
  exportData: () => string;
  importData: (text: string) => void;
  resetData: () => void;
}

const StoreContext = createContext<StoreValue | null>(null);

const now = () => new Date().toISOString().slice(0, 10);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<AppData | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    repo.getAll().then(setData);
  }, []);

  // Optimistic update: set state immediately, persist on a short debounce.
  const mutate = useRef((fn: (d: AppData) => AppData) => {});
  mutate.current = (fn) => {
    setData((prev) => {
      if (!prev) return prev;
      const next = fn(prev);
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => repo.saveAll(next), 250);
      return next;
    });
  };

  const value = useMemo<StoreValue | null>(() => {
    if (!data) return null;
    const m = (fn: (d: AppData) => AppData) => mutate.current(fn);

    const patchProject = (id: string, fn: (p: Project) => Project) =>
      m((d) => ({
        ...d,
        projects: d.projects.map((p) =>
          p.id === id ? { ...fn(p), updatedAt: now() } : p,
        ),
      }));

    const patchItems = (projectId: string, fn: (items: LineItem[]) => LineItem[]) =>
      patchProject(projectId, (p) => ({ ...p, lineItems: fn(p.lineItems) }));

    return {
      data,
      projects: data.projects,
      contractors: data.contractors,
      rates: data.rates,
      escalation: data.escalation,
      getProject: (id) => data.projects.find((p) => p.id === id),
      getContractor: (id) => data.contractors.find((c) => c.id === id),

      createProject: (input) => {
        const slugBase = input.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "");
        const id = `${slugBase || "project"}-${newId("p").slice(-4)}`;
        const project: Project = {
          id,
          name: input.name,
          client: input.client ?? "",
          location: input.location ?? "",
          province: input.province ?? "punjab",
          type: input.type ?? "commercial",
          csrSchedule: input.csrSchedule ?? "Punjab CSR 2022",
          contractorId: input.contractorId ?? data.contractors[0]?.id ?? "",
          area: input.area ?? 0,
          landArea: input.landArea,
          landUnit: input.landUnit,
          durationMonths: input.durationMonths ?? 12,
          startDate: input.startDate ?? now(),
          status: input.status ?? "draft",
          markups: input.markups ?? {
            overhead: 0.08,
            profit: 0.1,
            contingency: 0.04,
            salesTax: 0.16,
          },
          levies: input.levies ?? {
            incomeTaxWithholding: 0.075,
            isFiler: true,
            bidSecurity: 0.02,
            performanceGuarantee: 0.1,
            mobilizationAdvance: 0.15,
          },
          lineItems: input.lineItems ?? [],
          updatedAt: now(),
        };
        m((d) => ({ ...d, projects: [project, ...d.projects] }));
        return project;
      },

      updateProject: (id, patch) => patchProject(id, (p) => ({ ...p, ...patch })),

      duplicateProject: (id) => {
        const src = data.projects.find((p) => p.id === id);
        if (!src) return undefined;
        const copy: Project = {
          ...structuredClone(src),
          id: `${src.id}-copy-${newId("p").slice(-4)}`,
          name: `${src.name} (Copy)`,
          status: "draft",
          updatedAt: now(),
        };
        m((d) => ({ ...d, projects: [copy, ...d.projects] }));
        return copy;
      },

      setProjectStatus: (id, status) => patchProject(id, (p) => ({ ...p, status })),

      deleteProject: (id) =>
        m((d) => ({ ...d, projects: d.projects.filter((p) => p.id !== id) })),

      addLineItem: (projectId, tradeId, seed) =>
        patchItems(projectId, (items) => [
          ...items,
          {
            id: newId("li"),
            tradeId,
            itemCode: seed?.itemCode ?? "NEW",
            description: seed?.description ?? "New item",
            quantity: seed?.quantity ?? 1,
            unit: seed?.unit ?? "Each",
            cost: seed?.cost ?? { material: 0, labor: 0, equipment: 0 },
            keyMaterials: seed?.keyMaterials,
          },
        ]),

      updateLineItem: (projectId, itemId, patch) =>
        patchItems(projectId, (items) =>
          items.map((it) => (it.id === itemId ? { ...it, ...patch } : it)),
        ),

      duplicateLineItem: (projectId, itemId) =>
        patchItems(projectId, (items) => {
          const idx = items.findIndex((it) => it.id === itemId);
          if (idx === -1) return items;
          const clone = { ...structuredClone(items[idx]), id: newId("li") };
          const next = [...items];
          next.splice(idx + 1, 0, clone);
          return next;
        }),

      deleteLineItem: (projectId, itemId) =>
        patchItems(projectId, (items) => items.filter((it) => it.id !== itemId)),

      moveLineItem: (projectId, itemId, dir) =>
        patchItems(projectId, (items) => {
          const idx = items.findIndex((it) => it.id === itemId);
          if (idx === -1) return items;
          // reorder only within the same trade group
          const sameTrade = items[idx].tradeId;
          let target = idx + dir;
          while (target >= 0 && target < items.length && items[target].tradeId !== sameTrade) {
            target += dir;
          }
          if (target < 0 || target >= items.length) return items;
          const next = [...items];
          [next[idx], next[target]] = [next[target], next[idx]];
          return next;
        }),

      updateMarkups: (projectId, patch) =>
        patchProject(projectId, (p) => ({ ...p, markups: { ...p.markups, ...patch } })),

      updateLevies: (projectId, patch) =>
        patchProject(projectId, (p) => ({ ...p, levies: { ...p.levies, ...patch } })),

      createContractor: (input) => {
        const contractor: Contractor = {
          id: newId("ctr"),
          name: input.name,
          pecCategory: input.pecCategory ?? "C-3",
          isFiler: input.isFiler ?? true,
          ntn: input.ntn,
        };
        m((d) => ({ ...d, contractors: [...d.contractors, contractor] }));
        return contractor;
      },

      addRate: (seed) => {
        const r: RateItem = {
          id: newId("rate"),
          tradeId: seed?.tradeId ?? "concrete",
          itemCode: seed?.itemCode ?? "NEW",
          description: seed?.description ?? "New rate item",
          unit: seed?.unit ?? "Cft",
          cost: seed?.cost ?? { material: 0, labor: 0, equipment: 0 },
          keyMaterials: seed?.keyMaterials,
          schedule: seed?.schedule ?? "Custom",
        };
        m((d) => ({ ...d, rates: [r, ...d.rates] }));
        return r;
      },

      updateRate: (id, patch) =>
        m((d) => ({
          ...d,
          rates: d.rates.map((r) => (r.id === id ? { ...r, ...patch } : r)),
        })),

      deleteRate: (id) =>
        m((d) => ({ ...d, rates: d.rates.filter((r) => r.id !== id) })),

      updateEscalation: (patch) =>
        m((d) => ({ ...d, escalation: { ...d.escalation, ...patch } })),

      updateIndex: (key, annualPct) =>
        m((d) => ({
          ...d,
          escalation: {
            ...d.escalation,
            indices: d.escalation.indices.map((i) =>
              i.key === key ? { ...i, annualPct } : i,
            ),
          },
        })),

      exportData: () => exportJSON(data),
      importData: (text) => {
        const imported = importJSON(text);
        setData(imported);
        repo.saveAll(imported);
      },
      resetData: () => {
        repo.reset().then(setData);
      },
    };
  }, [data]);

  if (!value) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-subtle">
        Loading workspace…
      </div>
    );
  }

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within <StoreProvider>");
  return ctx;
}
