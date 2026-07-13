import type { Pool } from "pg";
import type { DebateStore } from "./store.js";
import type { DebateRecord } from "./types.js";

interface DebateRow {
  id: string;
  pitch: string;
  extra_roles: DebateRecord["addedRoles"];
  round1: DebateRecord["round1"];
  round2: DebateRecord["round2"];
  verdict: DebateRecord["verdict"];
  transcript_url: string | null;
  created_at: string;
}

function rowToRecord(row: DebateRow): DebateRecord {
  return {
    id: row.id,
    pitch: row.pitch,
    addedRoles: row.extra_roles,
    round1: row.round1,
    round2: row.round2,
    verdict: row.verdict,
    transcriptUrl: row.transcript_url,
    createdAt: new Date(row.created_at).toISOString(),
  };
}

export class PgDebateStore implements DebateStore {
  constructor(private pool: Pool) {}

  async create(record: DebateRecord): Promise<void> {
    await this.pool.query(
      `INSERT INTO debates (id, pitch, extra_roles, round1, round2, verdict, transcript_url, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        record.id,
        record.pitch,
        JSON.stringify(record.addedRoles),
        JSON.stringify(record.round1),
        JSON.stringify(record.round2),
        record.verdict ? JSON.stringify(record.verdict) : null,
        record.transcriptUrl,
        record.createdAt,
      ]
    );
  }

  async get(id: string): Promise<DebateRecord | undefined> {
    const { rows } = await this.pool.query<DebateRow>(
      `SELECT id, pitch, extra_roles, round1, round2, verdict, transcript_url, created_at
       FROM debates WHERE id = $1`,
      [id]
    );
    return rows[0] ? rowToRecord(rows[0]) : undefined;
  }

  async update(id: string, patch: Partial<DebateRecord>): Promise<void> {
    await this.pool.query(
      `UPDATE debates SET
         extra_roles    = COALESCE($2, extra_roles),
         round1         = COALESCE($3, round1),
         round2         = COALESCE($4, round2),
         verdict        = COALESCE($5, verdict),
         transcript_url = COALESCE($6, transcript_url)
       WHERE id = $1`,
      [
        id,
        patch.addedRoles ? JSON.stringify(patch.addedRoles) : null,
        patch.round1 ? JSON.stringify(patch.round1) : null,
        patch.round2 ? JSON.stringify(patch.round2) : null,
        patch.verdict ? JSON.stringify(patch.verdict) : null,
        patch.transcriptUrl ?? null,
      ]
    );
  }
}
