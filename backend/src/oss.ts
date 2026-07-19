// Alibaba Cloud OSS (Object Storage Service) client.
//
// This is the file referenced in the README as proof of Alibaba Cloud
// deployment: every completed debate transcript is uploaded here as JSON via
// the official `ali-oss` SDK. See transcript.ts for the fallback used when
// OSS credentials aren't configured (e.g. local development).

import OSS from "ali-oss";
import { config } from "./config.js";
import type { DebateRecord } from "./types.js";

export const isOssConfigured = Boolean(
  config.oss.accessKeyId && config.oss.accessKeySecret && config.oss.bucket
);

const client: OSS | null = isOssConfigured
  ? new OSS({
      region: config.oss.region,
      accessKeyId: config.oss.accessKeyId,
      accessKeySecret: config.oss.accessKeySecret,
      bucket: config.oss.bucket,
    })
  : null;

/**
 * Uploads a completed debate transcript to OSS as JSON and returns the
 * object's URL. Throws if OSS isn't configured. Callers should check
 * `isOssConfigured` (or catch and fall back) rather than call this blindly.
 */
export async function uploadTranscript(record: DebateRecord): Promise<string> {
  if (!client) {
    throw new Error("OSS is not configured (missing ALIBABA_ACCESS_KEY_ID/SECRET or OSS_BUCKET).");
  }

  const objectKey = `transcripts/${record.id}.json`;
  const body = Buffer.from(JSON.stringify(record, null, 2), "utf-8");

  const result = await client.put(objectKey, body, {
    mime: "application/json",
  });

  return result.url;
}
