// ============================================================================
// store.ts — persistence boundary. Everything the app reads/writes goes through
// the `repo` interface below. Today it is backed by localStorage; swapping to
// Supabase (or any API) means re-implementing this ONE file's `repo` object —
// the rest of the app only knows the interface.
// ============================================================================

import type {
  Contractor,
  EscalationAssumptions,
  Project,
  RateItem,
} from "./types";
import { SEED_CONTRACTORS, SEED_PROJECTS, SEED_RATES } from "./data";
import { defaultAssumptions } from "./escalation";

const STORAGE_KEY = "bidkar.appdata.v1";
const SCHEMA_VERSION = 1;

/** The entire application document. */
export interface AppData {
  version: number;
  projects: Project[];
  contractors: Contractor[];
  rates: RateItem[];
  escalation: EscalationAssumptions;
}

export function seedData(): AppData {
  return {
    version: SCHEMA_VERSION,
    projects: structuredClone(SEED_PROJECTS),
    contractors: structuredClone(SEED_CONTRACTORS),
    rates: structuredClone(SEED_RATES),
    escalation: defaultAssumptions(2026),
  };
}

/** The repository contract — the only surface a backend needs to satisfy. */
export interface Repository {
  getAll(): Promise<AppData>;
  saveAll(data: AppData): Promise<void>;
  reset(): Promise<AppData>;
}

function isBrowser(): boolean {
  return typeof window !== "undefined" && !!window.localStorage;
}

export const repo: Repository = {
  async getAll() {
    if (!isBrowser()) return seedData();
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seeded = seedData();
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
      return seeded;
    }
    try {
      const parsed = JSON.parse(raw) as AppData;
      if (!parsed.version || parsed.version !== SCHEMA_VERSION) {
        const seeded = seedData();
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
        return seeded;
      }
      return parsed;
    } catch {
      const seeded = seedData();
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
      return seeded;
    }
  },

  async saveAll(data) {
    if (!isBrowser()) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  },

  async reset() {
    const seeded = seedData();
    if (isBrowser()) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
    return seeded;
  },
};

// --- Export / Import (data survives & is shareable) -------------------------
export function exportJSON(data: AppData): string {
  return JSON.stringify(data, null, 2);
}

export function importJSON(text: string): AppData {
  const parsed = JSON.parse(text) as AppData;
  if (!parsed || !Array.isArray(parsed.projects)) {
    throw new Error("Invalid backup file — missing projects.");
  }
  return { ...seedData(), ...parsed, version: SCHEMA_VERSION };
}

// --- ID helpers -------------------------------------------------------------
let _counter = 0;
export function newId(prefix: string): string {
  _counter += 1;
  const rand = (performance.now() % 1 === 0 ? _counter : Math.floor(performance.now()))
    .toString(36)
    .slice(-4);
  return `${prefix}_${Date.now().toString(36)}_${_counter.toString(36)}${rand}`;
}
