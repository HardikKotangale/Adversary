import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { isOssConfigured, uploadTranscript } from "./oss.js";
import type { DebateRecord } from "./types.js";

const LOCAL_DIR = path.join(process.cwd(), "data", "transcripts");

async function persistLocally(record: DebateRecord): Promise<string> {
  await mkdir(LOCAL_DIR, { recursive: true });
  const filePath = path.join(LOCAL_DIR, `${record.id}.json`);
  await writeFile(filePath, JSON.stringify(record, null, 2), "utf-8");
  return `local://data/transcripts/${record.id}.json`;
}

/**
 * Persists a completed debate transcript. Uploads to Alibaba Cloud OSS when
 * configured (see oss.ts); otherwise falls back to local disk so this works
 * without cloud credentials in local development.
 */
export async function persistTranscript(record: DebateRecord): Promise<string> {
  if (isOssConfigured) {
    try {
      return await uploadTranscript(record);
    } catch (err) {
      console.error("OSS upload failed, falling back to local disk:", err);
    }
  }
  return persistLocally(record);
}
