import Dexie, { type EntityTable } from "dexie";
import type { WorkspaceSnapshot } from "@/types/procurement";

class ProcureIqDatabase extends Dexie {
  snapshots!: EntityTable<WorkspaceSnapshot, "id">;

  constructor() {
    super("procureiq-workspace");
    this.version(1).stores({ snapshots: "id, updatedAt" });
  }
}

let database: ProcureIqDatabase | undefined;

export const getWorkspaceDatabase = (): ProcureIqDatabase => {
  database ??= new ProcureIqDatabase();
  return database;
};
