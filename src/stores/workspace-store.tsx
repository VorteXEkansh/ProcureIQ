"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { generateDemoDataset } from "@/data/demo/generate";
import { identifySavingsOpportunities } from "@/domain/procurement/savings";
import { DEMO_SHOULD_COST_MODELS } from "@/domain/procurement/should-cost";
import { DEFAULT_SCORING_WEIGHTS } from "@/domain/procurement/supplier-scoring";
import { PREDEFINED_SCENARIOS } from "@/domain/procurement/scenario-engine";
import { getWorkspaceDatabase } from "@/lib/workspace-db";
import type {
  OpportunityStatus,
  ProcurementDataset,
  Scenario,
  ShouldCostModel,
  WorkspaceSettings,
  WorkspaceSnapshot,
} from "@/types/procurement";

const defaultSettings: WorkspaceSettings = {
  carryingRate: 0.18,
  maxSupplierShare: 0.6,
  riskPreference: "Balanced",
  scoringWeights: DEFAULT_SCORING_WEIGHTS,
};

const createDefaultSnapshot = (): WorkspaceSnapshot => {
  const dataset = generateDemoDataset();
  return {
    id: "active",
    dataset,
    opportunities: identifySavingsOpportunities(dataset),
    savedShouldCostModels: structuredClone(DEMO_SHOULD_COST_MODELS),
    savedScenarios: structuredClone(PREDEFINED_SCENARIOS),
    settings: structuredClone(defaultSettings),
    updatedAt: new Date().toISOString(),
  };
};

interface WorkspaceContextValue extends WorkspaceSnapshot {
  ready: boolean;
  persistenceAvailable: boolean;
  notice: string | null;
  dismissNotice: () => void;
  setOpportunityStatus: (id: string, status: OpportunityStatus) => void;
  saveShouldCostModel: (model: ShouldCostModel) => void;
  deleteShouldCostModel: (id: string) => void;
  saveScenario: (scenario: Scenario) => void;
  updateSettings: (settings: WorkspaceSettings) => void;
  importDataset: (dataset: ProcurementDataset) => void;
  restoreSnapshot: (snapshot: WorkspaceSnapshot) => void;
  resetWorkspace: () => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextValue | undefined>(undefined);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [snapshot, setSnapshot] = useState<WorkspaceSnapshot>(() => createDefaultSnapshot());
  const [ready, setReady] = useState(false);
  const [persistenceAvailable, setPersistenceAvailable] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const saved = await getWorkspaceDatabase().snapshots.get("active");
        if (saved && active) setSnapshot(saved);
      } catch {
        if (active) {
          setPersistenceAvailable(false);
          setNotice("Browser persistence is unavailable. This session still works, but changes may not survive reload.");
        }
      } finally {
        if (active) setReady(true);
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!ready || !persistenceAvailable) return;
    const handle = window.setTimeout(() => {
      getWorkspaceDatabase()
        .snapshots.put({ ...snapshot, updatedAt: new Date().toISOString() })
        .catch(() => {
          setPersistenceAvailable(false);
          setNotice("ProcureIQ could not save to IndexedDB. Export a workspace backup before leaving.");
        });
    }, 300);
    return () => window.clearTimeout(handle);
  }, [persistenceAvailable, ready, snapshot]);

  const update = useCallback((transform: (current: WorkspaceSnapshot) => WorkspaceSnapshot, message?: string) => {
    setSnapshot((current) => transform(current));
    if (message) setNotice(message);
  }, []);

  const value = useMemo<WorkspaceContextValue>(
    () => ({
      ...snapshot,
      ready,
      persistenceAvailable,
      notice,
      dismissNotice: () => setNotice(null),
      setOpportunityStatus: (id, status) =>
        update(
          (current) => ({ ...current, opportunities: current.opportunities.map((item) => (item.id === id ? { ...item, status } : item)) }),
          "Opportunity status updated.",
        ),
      saveShouldCostModel: (model) =>
        update(
          (current) => ({ ...current, savedShouldCostModels: [...current.savedShouldCostModels.filter((item) => item.id !== model.id), model] }),
          "Should-cost model saved locally.",
        ),
      deleteShouldCostModel: (id) =>
        update((current) => ({ ...current, savedShouldCostModels: current.savedShouldCostModels.filter((model) => model.id !== id) }), "Should-cost model deleted."),
      saveScenario: (scenario) =>
        update(
          (current) => ({ ...current, savedScenarios: [...current.savedScenarios.filter((item) => item.id !== scenario.id), scenario] }),
          "Scenario saved locally.",
        ),
      updateSettings: (settings) => update((current) => ({ ...current, settings }), "Workspace settings updated."),
      importDataset: (dataset) =>
        update(
          (current) => ({ ...current, dataset, opportunities: identifySavingsOpportunities(dataset) }),
          "Dataset imported and analytics recalculated.",
        ),
      restoreSnapshot: (restored) => update(() => restored, "Workspace restored from backup."),
      resetWorkspace: async () => {
        const reset = createDefaultSnapshot();
        setSnapshot(reset);
        setNotice("Workspace reset to deterministic demo data.");
        if (persistenceAvailable) await getWorkspaceDatabase().snapshots.put(reset);
      },
    }),
    [notice, persistenceAvailable, ready, snapshot, update],
  );

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export const useWorkspace = (): WorkspaceContextValue => {
  const context = useContext(WorkspaceContext);
  if (!context) throw new Error("useWorkspace must be used within WorkspaceProvider.");
  return context;
};
