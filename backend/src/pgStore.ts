import type { Pool } from "pg";
import type { DebateStore } from "./store.js";
import type { DebateRecord } from "./types.js";

interface DebateRow {
  id: string;
  pitch: string;
  turns: DebateRecord["turns"];
  active_persona_ids: DebateRecord["activePersonaIds"];
  verdict: DebateRecord["verdict"];
  transcript_url: string | null;
  created_at: string;
}

function rowToRecord(row: DebateRow): DebateRecord {
  return {
    id: row.id,
    pitch: row.pitch,
    turns: row.turns,
    activePersonaIds: row.active_persona_ids,
    verdict: row.verdict,
    transcriptUrl: row.transcript_url,
    createdAt: new Date(row.created_at).toISOString(),
  };
}

export class PgDebateStore implements DebateStore {
  constructor(private pool: Pool) {}

  async create(record: DebateRecord): Promise<void> {
    await this.pool.query(
      `INSERT INTO debates (id, pitch, turns, active_persona_ids, verdict, transcript_url, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        record.id,
        record.pitch,
        JSON.stringify(record.turns),
        JSON.stringify(record.activePersonaIds),
        record.verdict ? JSON.stringify(record.verdict) : null,
        record.transcriptUrl,
        record.createdAt,
      ]
    );
  }

  async get(id: string): Promise<DebateRecord | undefined> {
    const { rows } = await this.pool.query<DebateRow>(
      `SELECT id, pitch, turns, active_persona_ids, verdict, transcript_url, created_at
       FROM debates WHERE id = $1`,
      [id]
    );
    return rows[0] ? rowToRecord(rows[0]) : undefined;
  }

  async update(id: string, patch: Partial<DebateRecord>): Promise<void> {
    await this.pool.query(
      `UPDATE debates SET
         turns              = COALESCE($2, turns),
         active_persona_ids = COALESCE($3, active_persona_ids),
         verdict            = COALESCE($4, verdict),
         transcript_url     = COALESCE($5, transcript_url)
       WHERE id = $1`,
      [
        id,
        patch.turns ? JSON.stringify(patch.turns) : null,
        patch.activePersonaIds ? JSON.stringify(patch.activePersonaIds) : null,
        patch.verdict ? JSON.stringify(patch.verdict) : null,
        patch.transcriptUrl ?? null,
      ]
    );
  }
}
