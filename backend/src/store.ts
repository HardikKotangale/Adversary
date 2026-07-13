import { pool, isRdsConfigured } from "./db.js";
import { PgDebateStore } from "./pgStore.js";
import type { DebateRecord } from "./types.js";

export interface DebateStore {
  create(record: DebateRecord): Promise<void>;
  get(id: string): Promise<DebateRecord | undefined>;
  update(id: string, patch: Partial<DebateRecord>): Promise<void>;
}

/** In-memory fallback used when RDS isn't configured, so local dev works without a database. */
class InMemoryDebateStore implements DebateStore {
  private debates = new Map<string, DebateRecord>();

  async create(record: DebateRecord): Promise<void> {
    this.debates.set(record.id, record);
  }

  async get(id: string): Promise<DebateRecord | undefined> {
    return this.debates.get(id);
  }

  async update(id: string, patch: Partial<DebateRecord>): Promise<void> {
    const existing = this.debates.get(id);
    if (!existing) return;
    this.debates.set(id, { ...existing, ...patch });
  }
}

if (isRdsConfigured) {
  console.log("Debate store: Postgres (RDS)");
} else {
  console.log("Debate store: in-memory (set RDS_HOST to use Postgres)");
}

export const debateStore: DebateStore =
  isRdsConfigured && pool ? new PgDebateStore(pool) : new InMemoryDebateStore();
